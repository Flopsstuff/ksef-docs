---
original: pobieranie-faktur/przyrostowe-pobieranie-faktur.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [pobieranie-faktur/przyrostowe-pobieranie-faktur.md](https://github.com/CIRFMF/ksef-docs/blob/main/pobieranie-faktur/przyrostowe-pobieranie-faktur.md)

# Инкрементальное получение счетов-фактур
21.11.2025

## Введение

Инкрементальное получение счетов-фактур, основанное на экспорте пакетов (POST [`/invoices/exports`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post)), является рекомендуемым механизмом синхронизации между центральным репозиторием KSeF и локальными базами данных внешних систем.

Ключевую роль здесь играет механизм **[High Water Mark (HWM)](hwm.md)** - стабильная точка во времени, до которой система гарантирует полноту данных.

## Архитектура решения

Инкрементальное получение основано на трех ключевых компонентах:

1. **Синхронизация во временных окнах** - использование смежных временных окон с учетом HWM обеспечивает непрерывность и отсутствие пропусков
2. **Обработка лимитов API** - управление темпом вызовов, обработка HTTP 429 и Retry-After.
3. **Дедупликация** - устранение дубликатов на основе метаданных из файлов `_metadata.json`.

Базовый метод: POST [`/invoices/exports`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post) инициирует асинхронный экспорт. После завершения обработки статус операции предоставляет уникальные URL-адреса для загрузки частей пакета.

## Синхронизация во временных окнах (Windowing)

### Концепция

Получение счетов-фактур происходит в смежных временных окнах с использованием даты `PermanentStorageHwmDate`. Чтобы включить механизм HWM, необходимо установить параметр `restrictToPermanentStorageHwmDate = true` в запросе экспорта. Каждое следующее окно начинается точно в момент завершения предыдущего с учетом HWM (за исключением ситуации, описанной в разделе [Механизм High Water Mark (HWM) и обработка усеченных пакетов](#механизм-high-water-mark-hwm-и-обработка-усеченных-пакетов-istruncated)). Под "моментом завершения" понимается:

- значение `dateRange.to`, когда оно было указано, или
- `PermanentStorageHwmDate`, когда `dateRange.to` пропущено.

Такой подход обеспечивает непрерывность диапазонов и устраняет риск пропуска какого-либо счета-фактуры. Счета-фактуры должны получаться отдельно для каждого типа субъекта (`Podmiot 1`, `Podmiot 2`, `Podmiot 3`, `Podmiot upoważniony`), встречающегося в документе. Итерация по субъектам обеспечивает полноту данных - компания может выступать в разных ролях на счетах-фактурах.

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
// Словарь для отслеживания точки продолжения для каждого SubjectType
Dictionary<InvoiceSubjectType, DateTime?> continuationPoints = new();
IReadOnlyList<(DateTime From, DateTime To)> windows = BuildIncrementalWindows(batchCreationStart, batchCreationCompleted);

// Создание плана экспорта - кортежи (временное окно, тип субъекта)
IEnumerable<InvoiceSubjectType> subjectTypes = Enum.GetValues<InvoiceSubjectType>().Where(x => x != InvoiceSubjectType.SubjectAuthorized);
IOrderedEnumerable<ExportTask> exportTasks = windows
    .SelectMany(window => subjectTypes, (window, subjectType) => new ExportTask(window.From, window.To, subjectType))
    .OrderBy(task => task.From)
    .ThenBy(task => task.SubjectType);


foreach (ExportTask task in exportTasks)
{
    DateTime effectiveFrom = GetEffectiveStartDate(continuationPoints, task.SubjectType, task.From);

    OperationResponse? exportResponse = await InitiateInvoiceExportAsync(effectiveFrom, task.To, task.SubjectType);

    // Дальнейшая обработка экспорта...
```

Пример на языке ```java```:
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

// Дальнейшая обработка экспорта...
```

### Рекомендуемые размеры окон

- **Частота и лимиты**  
    POST `/invoice/exports` требует указания типа субъекта (`Podmiot 1`, `Podmiot 2`, `Podmiot 3`, `Podmiot upoważniony`). Согласно [лимитам API](../limity/limity-api.md) можно инициировать максимум 20 экспортов в час; расписание должно распределять этот пул между выбранными типами субъектов.
- **Стратегия расписания**  
    В режиме непрерывной синхронизации можно принять 4 экспорта/ч на каждый тип субъекта. На практике роли `Podmiot 3` и `Podmiot upoważniony` обычно встречаются реже и могут запускаться спорадически, например, раз в сутки в ночном окне.
- **Минимальный интервал**  
    Циклический интервал не должен быть короче 15 минут для каждого типа субъекта (согласно рекомендациям в лимитах API).
- **Размер окна**
    В сценарии непрерывной синхронизации рекомендуется вызов экспорта без указанной даты окончания (`DateRange.To` пропущено). В таком случае система KSeF готовит максимально большой, согласованный пакет в пределах лимитов алгоритма (количество счетов-фактур, размер данных после сжатия), что ограничивает количество вызовов и нагрузку с обеих сторон. Когда `IsTruncated = true`, следующий вызов нужно начинать с `LastPermanentStorageDate`, когда `IsTruncated = false`, следующий вызов нужно начинать с возвращенного `PermanentStorageHwmDate`.
- **Отсутствие наложения**
    Диапазоны должны быть смежными; конец одного окна является началом следующего.
- **Контрольная точка**
    Точка продолжения, определяемая HWM - `PermanentStorageHwmDate` или `LastPermanentStorageDate` для усеченных пакетов составляет начало следующего окна.

>Датой получения счета-фактуры является дата присвоения номера KSeF. Номер присваивается во время обработки счета-фактуры со стороны KSeF и не зависит от момента загрузки во внешнюю систему.

## Обработка лимитов API

### Лимиты по типу эндпойнтов

Все эндпойнты, связанные с получением счетов-фактур, подлежат строгим лимитам API, определенным в документации [Лимиты API](../limity/limity-api.md). Эти лимиты являются обязательными и должны соблюдаться каждой реализацией инкрементального получения.

В случае превышения лимитов система возвращает код HTTP `429` (Too Many Requests) вместе с заголовком `Retry-After`, указывающим время ожидания перед следующей попыткой.

## Инициализация экспорта счетов-фактур

### Ключевое значение даты PermanentStorage

Для инкрементального получения счетов-фактур **необходимо** использовать дату типа `PermanentStorage`, которая обеспечивает достоверность данных. Означает момент постоянной материализации записи, устойчива к асинхронным задержкам процесса принятия данных и позволяет безопасно определять окна приращения.
Таким образом, другие типы дат (как `Issue` или `Invoicing`) могут привести к непредсказуемому поведению при инкрементальной синхронизации.

Пример на языке ```C#```:
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

Пример на языке ```java```:
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

## Получение и обработка пакетов

После завершения экспорта пакет счетов-фактур доступен для загрузки как зашифрованный архив ZIP, разделенный на части. Процесс загрузки и обработки включает:

1. **Загрузка частей** - каждая часть загружается отдельно с URL-адресов, возвращенных в статусе операции.
2. **Расшифровка AES-256** - каждая часть расшифровывается с использованием ключа и IV, сгенерированных при инициализации экспорта.
3. **Сборка пакета** - расшифрованные части объединяются в один поток данных.
4. **Распаковка ZIP** - архив содержит XML-файлы счетов-фактур и файл `_metadata.json`.

### Файл _metadata.json

Содержимое файла _metadata.json представляет собой JSON-объект со свойством `invoices` (массив элементов типа `InvoiceMetadata`, как возвращаемый POST `/invoices/query/metadata`).
Этот файл является ключевым для механизма дедупликации, поскольку содержит номера KSeF всех счетов-фактур в пакете.

**Включение метаданных (до 27.10.2025)**  
Чтобы включить файл `_metadata.json`, необходимо добавить заголовок к запросу экспорта:

```http
X-KSeF-Feature: include-metadata
```

**С 27.10.2025** пакет экспорта всегда будет содержать файл `_metadata.json` без необходимости добавления заголовка.

Пример на языке ```C#```:

[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

[KSeF.Client.Tests.Utils\BatchSessionUtils.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Utils/BatchSessionUtils.cs)

```csharp
List<InvoiceSummary> metadataSummaries = new();
Dictionary<string, string> invoiceXmlFiles = new(StringComparer.OrdinalIgnoreCase);

// Получение, расшифровка и объединение всех частей в один поток
using MemoryStream decryptedArchiveStream = await BatchUtils.DownloadAndDecryptPackagePartsAsync(
    package.Parts, 
    encryptionData, 
    CryptographyService, 
    cancellationToken: CancellationToken)
    .ConfigureAwait(false);

// Распаковка ZIP
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

Пример на языке ```java```:
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

## Механизм High Water Mark (HWM) и обработка усеченных пакетов (IsTruncated)

### Концепция HWM

High Water Mark (HWM) - это механизм, обеспечивающий оптимальное управление начальными точками для последующих экспортов при инкрементальном получении счетов-фактур. HWM состоит из двух взаимодополняющих компонентов:

- **`PermanentStorageHwmDate`** - стабильная верхняя граница данных, включенных в пакет, представляющая момент, до которого система гарантирует полноту данных.
- **`LastPermanentStorageDate`** - дата последнего счета-фактуры в пакете, используемая когда пакет был усечен (`IsTruncated = true`).

#### Преимущества механизма HWM

- **Минимизация дубликатов** - HWM значительно сокращает количество дубликатов между последующими пакетами
- **Оптимизация производительности** - уменьшает нагрузку на механизм дедупликации  
- **Сохранение полноты** - обеспечивает, что никакие счета-фактуры не будут пропущены
- **Стабильность синхронизации** - предоставляет надежные точки продолжения для длительных процессов

### Стратегия продолжения пакетов

Флаг `IsTruncated = true` устанавливается, когда при построении пакета достигнуты лимиты алгоритма (количество счетов-фактур или размер данных после сжатия). В таком случае в статусе операции доступны оба свойства HWM.
Механизм HWM использует следующую иерархию приоритетов для определения точки продолжения. Чтобы сохранить непрерывность получения и не пропустить ни одного документа, следующий вызов экспорта должен начинаться с:

1. **Усеченный пакет** (`IsTruncated = true`) - следующий вызов начинается с `LastPermanentStorageDate`
2. **Стабильный HWM** - использование `PermanentStorageHwmDate` как начальной точки для следующего окна

- следующее окно начинается в той же точке, где закончилось (смежность); возможные дубликаты будут удалены на этапе дедупликации на основе номеров KSeF из _metadata.json.
Ниже приведен пример поддержания точки продолжения:

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
private static void UpdateContinuationPointIfNeeded(
    Dictionary<InvoiceSubjectType, DateTime?> continuationPoints,
    InvoiceSubjectType subjectType,
    InvoiceExportPackage package)
{
    // Приоритет 1: Усеченный пакет - LastPermanentStorageDate
    if (package.IsTruncated && package.LastPermanentStorageDate.HasValue)
    {
        continuationPoints[subjectType] = package.LastPermanentStorageDate.Value.UtcDateTime;
    }
    // Приоритет 2: Стабильный HWM как граница следующего окна
    else if (package.PermanentStorageHwmDate.HasValue)
    {
        continuationPoints[subjectType] = package.PermanentStorageHwmDate.Value.UtcDateTime;
    }
    else
    {
        // Диапазон полностью обработан - удаление точки продолжения
        continuationPoints.Remove(subjectType);
    }
}
```

Пример на языке ```java```:
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

## Дедупликация счетов-фактур

### Стратегия дедупликации

Дедупликация происходит на основе номеров KSeF, содержащихся в файле `_metadata.json`:

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
Dictionary<string, InvoiceSummary> uniqueInvoices = new(StringComparer.OrdinalIgnoreCase);
bool hasDuplicates = false;

// Обработка метаданных из пакета - добавление уникальных счетов-фактур и обнаружение дубликатов
hasDuplicates = packageResult.MetadataSummaries
    .DistinctBy(s => s.KsefNumber, StringComparer.OrdinalIgnoreCase)
    .Any(summary => !uniqueInvoices.TryAdd(summary.KsefNumber, summary));
```

Пример на языке ```java```:
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

## Связанные документы

- [High Water Mark](hwm.md)
- [Лимиты API](../limity/limity-api.md)
- [Получение счетов-фактур](pobieranie-faktur.md)
