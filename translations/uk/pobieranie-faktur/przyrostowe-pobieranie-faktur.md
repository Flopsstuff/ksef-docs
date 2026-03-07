---
original: pobieranie-faktur/przyrostowe-pobieranie-faktur.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [pobieranie-faktur/przyrostowe-pobieranie-faktur.md](https://github.com/CIRFMF/ksef-docs/blob/main/pobieranie-faktur/przyrostowe-pobieranie-faktur.md)

# Поступове завантаження рахунків-фактур
21.11.2025

## Вступ

Поступове завантаження рахунків-фактур, засноване на експорті пакетів (POST [`/invoices/exports`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post)), є рекомендованим механізмом синхронізації між централізованим репозиторієм KSeF та локальними базами даних зовнішніх систем.

Ключову роль відіграє тут механізм **[High Water Mark (HWM)](hwm.md)** - стабільна точка в часі, до якої система гарантує повноту даних.

## Архітектура рішення

Поступове завантаження базується на трьох ключових компонентах:

1. **Синхронізація у часових вікнах** - використання прилеглих часових вікон з урахуванням HWM, що забезпечує безперервність і відсутність пропусків
2. **Обробка лімітів API** - керування темпом викликів, обробка HTTP 429 та Retry-After.
3. **Дедуплікація** - усунення дублікатів на основі метаданих з файлів `_metadata.json`.

Базовий метод: POST [`/invoices/exports`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post) ініціює асинхронний експорт. Після завершення обробки статус операції надає унікальні URL-адреси для завантаження частин пакета.

## Синхронізація у часових вікнах (Windowing)

### Концепція

Завантаження рахунків-фактур відбувається в прилеглих часових вікнах з використанням дати `PermanentStorageHwmDate`. Для увімкнення механізму HWM необхідно встановити параметр `restrictToPermanentStorageHwmDate = true` у запиті експорту. Кожне наступне вікно починається точно в момент завершення попереднього з урахуванням HWM (за винятком ситуації, описаної в розділі [Механізм High Water Mark (HWM) і обробка обрізаних пакетів](#механізм-high-water-mark-hwm-і-обробка-обрізаних-пакетів-istruncated)). Під "моментом завершення" розуміється:

- значення `dateRange.to`, коли воно було вказано, або
- `PermanentStorageHwmDate` коли `dateRange.to` пропущено.

Такий підхід забезпечує безперервність діапазонів і усуває ризик пропуску будь-якого рахунку-фактури. Рахунки-фактури повинні завантажуватися окремо для кожного типу суб'єкта (`Суб'єкт 1`, `Суб'єкт 2`, `Суб'єкт 3`, `Уповноважений суб'єкт`), що зустрічається в документі. Ітерація через суб'єкти забезпечує повноту даних - компанія може виступати в різних ролях на рахунках-фактурах.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
// Словник для відстеження точки продовження для кожного SubjectType
Dictionary<InvoiceSubjectType, DateTime?> continuationPoints = new();
IReadOnlyList<(DateTime From, DateTime To)> windows = BuildIncrementalWindows(batchCreationStart, batchCreationCompleted);

// Створення плану експорту - кортежі (часове вікно, тип суб'єкта)
IEnumerable<InvoiceSubjectType> subjectTypes = Enum.GetValues<InvoiceSubjectType>().Where(x => x != InvoiceSubjectType.SubjectAuthorized);
IOrderedEnumerable<ExportTask> exportTasks = windows
    .SelectMany(window => subjectTypes, (window, subjectType) => new ExportTask(window.From, window.To, subjectType))
    .OrderBy(task => task.From)
    .ThenBy(task => task.SubjectType);


foreach (ExportTask task in exportTasks)
{
    DateTime effectiveFrom = GetEffectiveStartDate(continuationPoints, task.SubjectType, task.From);

    OperationResponse? exportResponse = await InitiateInvoiceExportAsync(effectiveFrom, task.To, task.SubjectType);

    // Подальша обробка експорту...
```

Приклад мовою ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
Map<InvoiceQuerySubjectType, OffsetDateTime> continuationPoints = new HashMap<>();

List<TimeWindows> timeWindows = buildIncrementalWindows(batchCreationStart, batchCreationCompleted);
List<InvoiceQuerySubjectType> subjectTypes = Arrays.stream(InvoiceQuerySubjectType.values())
        .filter(x -> x != InvoiceQuerySubjectType.SUBJECTAUTHORIZED)
        .toList();

List<ExportTask> exportTasks = timeWindows.stream()
        .flatMap(window -> subjectTypes.stream()
                .map(subjectType -> new ExportTask(window.getFrom(), window.getTo(), subjectType)))
        .sorted(Comparator.comparing(ExportTask::getFrom)
                .thenComparing(ExportTask::getSubjectType))
        .toList();
exportTasks.forEach(task -> {
        EncryptionData encryptionData = defaultCryptographyService.getEncryptionData();
        OffsetDateTime effectiveFrom = getEffectiveStartDate(continuationPoints, task.getSubjectType(), task.getFrom());
        String operationReferenceNumber = initiateInvoiceExportAsync(effectiveFrom, task.getTo(),
            task.getSubjectType(), accessToken, encryptionData.encryptionInfo());

// Подальша обробка експорту...
```

### Рекомендовані розміри вікон

- **Частота та ліміти**  
    POST `/invoice/exports` вимагає вказання типу суб'єкта (`Суб'єкт 1`, `Суб'єкт 2`, `Суб'єкт 3`, `Уповноважений суб'єкт`). Відповідно до [лімітів API](../limity/limity-api.md) можна ініціювати максимум 20 експортів на годину; розклад повинен ділити цей пул між обраними типами суб'єктів.
- **Стратегія розкладу**  
    У режимі безперервної синхронізації можна прийняти 4 експорти/год на кожен тип суб'єкта. На практиці ролі `Суб'єкт 3` і `Уповноважений суб'єкт` зазвичай зустрічаються рідше і можуть запускатися спорадично, наприклад, раз на добу в нічному вікні.
- **Мінімальний інтервал**  
    Циклічний інтервал не повинен бути коротшим ніж 15 хвилин для кожного типу суб'єкта (відповідно до рекомендацій у лімітах API).
- **Розмір вікна**
    У сценарії безперервної синхронізації рекомендується виклик експорту без визначеної дати закінчення (`DateRange.To` пропущено). У такому випадку система KSeF готує найбільший можливий, узгоджений пакет у межах лімітів алгоритму (кількість рахунків-фактур, розмір даних після стиснення), що обмежує кількість викликів і навантаження з обох сторін. Коли `IsTruncated = true`, наступний виклик слід починати від `LastPermanentStorageDate`, коли `IsTruncated = false`, наступний виклик слід починати від поверненого `PermanentStorageHwmDate`.
- **Відсутність накладання**
    Діапазони повинні бути прилеглими; кінець одного вікна є початком наступного.
- **Контрольна точка**
    Точка продовження, визначена HWM - `PermanentStorageHwmDate` або `LastPermanentStorageDate` для обрізаних пакетів становить початок наступного вікна.

>Датою отримання рахунку-фактури є дата надання номера KSeF. Номер надається під час обробки рахунку-фактури з боку KSeF і не залежить від моменту завантаження до зовнішньої системи.

## Обробка лімітів API

### Ліміти згідно з типом ендпоінтів

Всі ендпоінти, пов'язані із завантаженням рахунків-фактур, підлягають суворим лімітам API, визначеним у документації [Ліміти API](../limity/limity-api.md). Ці ліміти є обов'язковими і повинні дотримуватися кожною реалізацією поступового завантаження.

У випадку перевищення лімітів система повертає код HTTP `429` (Too Many Requests) разом із заголовком `Retry-After`, що вказує час очікування перед наступною спробою.

## Ініціалізація експорту рахунків-фактур

### Ключове значення дати PermanentStorage

Для поступового завантаження рахунків-фактур **необхідно** використовувати дату типу `PermanentStorage`, яка забезпечує достовірність даних. Вона означає момент постійної матеріалізації запису, стійка до асинхронних затримок процесу прийняття даних і дозволяє безпечно визначати вікна приросту.
Тому інші типи дат (як `Issue` чи `Invoicing`) можуть призводити до непередбачуваної поведінки в поступовій синхронізації.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
EncryptionData exportEncryption = CryptographyService.GetEncryptionData();

InvoiceQueryFilters filters = new()
{
    SubjectType = subjectType,
    DateRange = new DateRange
    {
        DateType = DateType.PermanentStorage,
        From = windowFromUtc,
        To = windowToUtc,
        RestrictToPermanentStorageHwmDate = true
    }
};

InvoiceExportRequest request = new()
{
    Filters = filters,
    Encryption = exportEncryption.EncryptionInfo
};

OperationResponse response = awat KsefClient.ExportInvoicesAsync(request, _accessToken, ct, includeMetadata: true);
```

Приклад мовою ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
EncryptionData encryptionData = defaultCryptographyService.getEncryptionData();
InvoiceExportFilters filters = new InvoiceExportFilters();
filters.setSubjectType(subjectType);
filters.setDateRange(new InvoiceQueryDateRange(
        InvoiceQueryDateType.PERMANENTSTORAGE, windowFrom, windowTo)
);

InvoiceExportRequest request = new InvoiceExportRequest();
request.setFilters(filters);
request.setEncryption(encryptionInfo);

InitAsyncInvoicesQueryResponse response = ksefClient.initAsyncQueryInvoice(request, accessToken);
```

## Завантаження та обробка пакетів

Після завершення експорту пакет рахунків-фактур доступний для завантаження як зашифрований ZIP-архів, розділений на частини. Процес завантаження та обробки включає:

1. **Завантаження частин** - кожна частина завантажується окремо з URL-адрес, повернених у статусі операції.
2. **Розшифрування AES-256** - кожна частина розшифровується за допомогою ключа та IV, згенерованих під час ініціалізації експорту.
3. **Складання пакета** - розшифровані частини об'єднуються в один потік даних.
4. **Розпакування ZIP** - архів містить XML-файли рахунків-фактур та файл `_metadata.json`.

### Файл _metadata.json

Вміст файлу _metadata.json - це JSON-об'єкт із властивістю `invoices` (масив елементів типу `InvoiceMetadata`, як повертається POST `/invoices/query/metadata`).
Цей файл є ключовим для механізму дедуплікації, оскільки містить номери KSeF всіх рахунків-фактур у пакеті.

**Включення метаданих (до 27.10.2025)**  
Для включення файлу `_metadata.json` необхідно додати заголовок до запиту експорту:

```http
X-KSeF-Feature: include-metadata
```

**Від 27.10.2025** пакет експорту завжди міститиме файл `_metadata.json` без необхідності додавання заголовка.

Приклад мовою ```C#```:

[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

[KSeF.Client.Tests.Utils\BatchSessionUtils.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Utils/BatchSessionUtils.cs)

```csharp
List<InvoiceSummary> metadataSummaries = new();
Dictionary<string, string> invoiceXmlFiles = new(StringComparer.OrdinalIgnoreCase);

// Завантаження, розшифрування та об'єднання всіх частин в один потік
using MemoryStream decryptedArchiveStream = await BatchUtils.DownloadAndDecryptPackagePartsAsync(
    package.Parts, 
    encryptionData, 
    CryptographyService, 
    cancellationToken: CancellationToken)
    .ConfigureAwait(false);

// Розпакування ZIP
Dictionary<string, string> unzippedFiles = await BatchUtils.UnzipAsync(decryptedArchiveStream, CancellationToken).ConfigureAwait(false);

foreach ((string fileName, string content) in unzippedFiles)
{
    if (fileName.Equals(MetadataEntryName, StringComparison.OrdinalIgnoreCase))
    {
        InvoicePackageMetadata? metadata = JsonSerializer.Deserialize<InvoicePackageMetadata>(content, MetadataSerializerOptions);
        if (metadata?.Invoices != null)
        {
            metadataSummaries.AddRange(metadata.Invoices);
        }
    }
    else if (fileName.EndsWith(XmlFileExtension, StringComparison.OrdinalIgnoreCase))
    {
        invoiceXmlFiles[fileName] = content;
    }
}
```

Приклад мовою ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
 List<InvoicePackagePart> parts = invoiceExportStatus.getPackageParts().getParts();
byte[] mergedZip = FilesUtil.mergeZipParts(
        encryptionData,
        parts,
        part -> ksefClient.downloadPackagePart(part),
        (encryptedPackagePart, key, iv) -> defaultCryptographyService.decryptBytesWithAes256(encryptedPackagePart, key, iv)
);
Map<String, String> downloadedFiles = FilesUtil.unzip(mergedZip);

String metadataJson = downloadedFiles.keySet()
        .stream()
        .filter(fileName -> fileName.endsWith(".json"))
        .findFirst()
        .map(downloadedFiles::get)
        .orElse(null);
InvoicePackageMetadata invoicePackageMetadata = objectMapper.readValue(metadataJson, InvoicePackageMetadata.class);
```

## Механізм High Water Mark (HWM) і обробка обрізаних пакетів (IsTruncated)

### Концепція HWM

High Water Mark (HWM) - це механізм, що забезпечує оптимальне управління стартовими точками для наступних експортів у поступовому завантаженні рахунків-фактур. HWM складається з двох комплементарних компонентів:

- **`PermanentStorageHwmDate`** - стабільна верхня межа даних, включених у пакет, що представляє момент, до якого система гарантує повноту даних.
- **`LastPermanentStorageDate`** - дата останнього рахунку-фактури в пакеті, використовується, коли пакет було обрізано (`IsTruncated = true`).

#### Переваги механізму HWM

- **Мінімізація дублікатів** - HWM значно зменшує кількість дублікатів між наступними пакетами
- **Оптимізація продуктивності** - зменшує навантаження механізму дедуплікації
- **Збереження повноти** - забезпечує, що жодні рахунки-фактури не будуть пропущені
- **Стабільність синхронізації** - надає надійні точки продовження для довготривалих процесів

### Стратегія продовження пакетів

Прапор `IsTruncated = true` встановлюється, коли під час побудови пакета досягнуто лімітів алгоритму (кількість рахунків-фактур або розмір даних після стиснення). У такому випадку в статусі операції доступні обидві властивості HWM.
Механізм HWM використовує наступну ієрархію пріоритетів для визначення точки продовження. Щоб зберегти безперервність завантаження і не пропустити жодного документа, наступний виклик експорту слід починати від:

1. **Обрізаний пакет** (`IsTruncated = true`) - наступний виклик починається від `LastPermanentStorageDate`
2. **Стабільний HWM** - використання `PermanentStorageHwmDate` як стартової точки для наступного вікна

- наступне вікно починається в тій же точці, що й завершене (прилеглість); можливі дублікати будуть видалені на етапі дедуплікації на основі номерів KSeF з _metadata.json.
Нижче приклад підтримання точки продовження:

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
private static void UpdateContinuationPointIfNeeded(
    Dictionary<InvoiceSubjectType, DateTime?> continuationPoints,
    InvoiceSubjectType subjectType,
    InvoiceExportPackage package)
{
    // Пріоритет 1: Обрізаний пакет - LastPermanentStorageDate
    if (package.IsTruncated && package.LastPermanentStorageDate.HasValue)
    {
        continuationPoints[subjectType] = package.LastPermanentStorageDate.Value.UtcDateTime;
    }
    // Пріоритет 2: Стабільний HWM як межа наступного вікна
    else if (package.PermanentStorageHwmDate.HasValue)
    {
        continuationPoints[subjectType] = package.PermanentStorageHwmDate.Value.UtcDateTime;
    }
    else
    {
        // Діапазон повністю оброблено - видалення точки продовження
        continuationPoints.Remove(subjectType);
    }
}
```

Приклад мовою ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
private void updateContinuationPointIfNeeded(Map<InvoiceQuerySubjectType, OffsetDateTime> continuationPoints,
                                                 InvoiceQuerySubjectType subjectType,
                                                 InvoiceExportPackage invoiceExportPackage) {
    if (Boolean.TRUE.equals(invoiceExportPackage.getIsTruncated()) && Objects.nonNull(invoiceExportPackage.getLastPermanentStorageDate())) {
        continuationPoints.put(subjectType, invoiceExportPackage.getLastPermanentStorageDate());
    } else {
        continuationPoints.remove(subjectType);
    }
}
```

## Дедуплікація рахунків-фактур

### Стратегія дедуплікації

Дедуплікація відбувається на основі номерів KSeF, що містяться в файлі `_metadata.json`:

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
Dictionary<string, InvoiceSummary> uniqueInvoices = new(StringComparer.OrdinalIgnoreCase);
bool hasDuplicates = false;

// Обробка метаданих з пакета - додавання унікальних рахунків-фактур та виявлення дублікатів
hasDuplicates = packageResult.MetadataSummaries
    .DistinctBy(s => s.KsefNumber, StringComparer.OrdinalIgnoreCase)
    .Any(summary => !uniqueInvoices.TryAdd(summary.KsefNumber, summary));
```

Приклад мовою ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
hasDuplicates.set(packageProcessingResult.getInvoiceMetadataList()
        .stream()
        .anyMatch(summary -> uniqueInvoices.containsKey(summary.getKsefNumber())));

packageProcessingResult.getInvoiceMetadataList()
        .stream()
        .distinct()
        .forEach(summary -> uniqueInvoices.put(summary.getKsefNumber(), summary));
```

## Пов'язані документи

- [High Water Mark](hwm.md)
- [Ліміти API](../limity/limity-api.md)
- [Завантаження рахунків-фактур](pobieranie-faktur.md)
