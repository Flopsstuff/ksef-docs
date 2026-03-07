---
original: sesja-wsadowa.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [sesja-wsadowa.md](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-wsadowa.md)

## Пакетна сесія
10.07.2025

Пакетна відправка дозволяє одноразово надіслати кілька рахунків-фактур у одному ZIP-файлі, замість надсилання кожного рахунку-фактури окремо.

Це рішення прискорює та полегшує обробку великої кількості документів — особливо для компаній, які генерують багато рахунків-фактур щодня.

Кожен рахунок-фактура має бути підготовлений у форматі XML згідно з актуальною схемою, опублікованою Міністерством фінансів:
* ZIP-пакет повинен бути розділений на частини розміром не більше 100 МБ (до шифрування), які шифруються та надсилаються окремо.
* Необхідно надати інформацію про кожну частину пакета в об'єкті ```fileParts```.


### Попередні вимоги
Щоб скористатися пакетною відправкою, спочатку потрібно пройти процес [автентифікації](uwierzytelnianie.md) та мати актуальний токен доступу (```accessToken```), який дає право на користування захищеними ресурсами API KSeF.

**Рекомендація (кореляція статусів за `invoiceHash`)**  
Перед створенням пакета для пакетної відправки рекомендується обчислити хеш SHA-256 для кожного XML-файлу рахунку-фактури (оригінал, до шифрування) та зберегти локальне мапування. Це дозволяє однозначно пов'язати статуси обробки на стороні KSeF з локальними вихідними документами (XML), підготованими для відправки.

Перед відкриттям сесії та надсиланням рахунків-фактур необхідно:
* згенерувати симетричний ключ довжиною 256 біт та вектор ініціалізації довжиною 128 біт (IV), що додається як префікс до шифрограми,
* підготувати ZIP-пакет,
* (опціонально, якщо пакет перевищує допустимий розмір) розділити ZIP-пакет на частини,
* зашифрувати частини алгоритмом AES-256-CBC з доповненням PKCS#7,
* зашифрувати симетричний ключ алгоритмом RSAES-OAEP (padding OAEP з функцією MGF1 на основі SHA-256 та хешем SHA-256), використовуючи публічний ключ KSeF Міністерства фінансів.

Ці операції можна реалізувати за допомогою компонента ```CryptographyService```, доступного в офіційному клієнті KSeF. Ця бібліотека надає готові методи для генерації та шифрування ключів згідно з вимогами системи.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
EncryptionData encryptionData = cryptographyService.GetEncryptionData();
```
Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
EncryptionData encryptionData = cryptographyService.getEncryptionData();
```

Згенеровані дані служать для шифрування рахунків-фактур.

### 1. Підготовка ZIP-пакета
Потрібно створити ZIP-пакет, що містить усі рахунки-фактури, які будуть надіслані в рамках однієї сесії.  

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
(byte[] zipBytes, Client.Core.Models.Sessions.FileMetadata zipMeta) =
    BatchUtils.BuildZip(invoices, cryptographyService);

//BatchUtils.BuildZip
public static (byte[] ZipBytes, FileMetadata Meta) BuildZip(
    IEnumerable<(string FileName, byte[] Content)> files,
    ICryptographyService crypto)
{
    using MemoryStream zipStream = new MemoryStream();
    using ZipArchive archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true);
    
    foreach ((string fileName, byte[] content) in files)
    {
        ZipArchiveEntry entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
        using Stream entryStream = entry.Open();
        entryStream.Write(content);
    }
    
    archive.Dispose();
    
    byte[] zipBytes = zipStream.ToArray();
    List<byte[]> meta = crypto.GetMetaData(zipBytes);

    return (zipBytes, meta);
}
```

Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
byte[] zipBytes = FilesUtil.createZip(invoicesInMemory);

// get ZIP metadata (before crypto)
FileMetadata zipMetadata = defaultCryptographyService.getMetaData(zipBytes);
```

### 2. Бінарний поділ ZIP-пакета на частини

Через обмеження розміру файлів, що передаються, ZIP-пакет повинен бути бінарно розділений на менші частини, які будуть передаватися окремо. Кожна частина повинна мати унікальну назву та порядковий номер.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp

 // Отримати метадані ZIP-файлу (до шифрування)
FileMetadata zipMetadata = cryptographyService.GetMetaData(zipBytes);
int maxPartSize = 100 * 1000 * 1000; // 100 MB
int partCount = (int)Math.Ceiling((double)zipBytes.Length / maxPartSize);
int partSize = (int)Math.Ceiling((double)zipBytes.Length / partCount);
List<byte[]> zipParts = new List<byte[]>();
for (int i = 0; i < partCount; i++)
{
    int start = i * partSize;
    int size = Math.Min(partSize, zipBytes.Length - start);
    if (size <= 0) break;
    byte[] part = new byte[size];
    Array.Copy(zipBytes, start, part, 0, size);
    zipParts.Add(part);
}

```

Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
List<byte[]> zipParts = FilesUtil.splitZip(partsCount, zipBytes);
```

### 3. Шифрування частин пакета
Кожну частину потрібно зашифрувати новозгенерованим ключем AES‑256‑CBC з доповненням PKCS#7.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionStreamE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionStreamE2ETests.cs)
```csharp
List<BatchPartStreamSendingInfo> encryptedParts = new(rawParts.Count);
for (int i = 0; i < rawParts.Count; i++)
{
    using MemoryStream partInput = new(rawParts[i], writable: false);
    MemoryStream encryptedOutput = new();
    await cryptographyService.EncryptStreamWithAES256Async(partInput, encryptedOutput, encryptionData.CipherKey, encryptionData.CipherIv, CancellationToken).ConfigureAwait(false);

    if (encryptedOutput.CanSeek)
    {
        encryptedOutput.Position = 0;
    }

    FileMetadata partMeta = await cryptographyService.GetMetaDataAsync(encryptedOutput, CancellationToken).ConfigureAwait(false);
    if (encryptedOutput.CanSeek)
    {
        encryptedOutput.Position = 0; // reset po odczycie do metadanych
    }

    encryptedParts.Add(new BatchPartStreamSendingInfo
    {
        DataStream = encryptedOutput,
        OrdinalNumber = i + 1,
        Metadata = partMeta
    });
}
```

Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
 List<BatchPartSendingInfo> encryptedZipParts = new ArrayList<>();
 for (int i = 0; i < zipParts.size(); i++) {
     byte[] encryptedZipPart = defaultCryptographyService.encryptBytesWithAES256(
             zipParts.get(i),
             cipherKey,
             cipherIv
     );
     FileMetadata zipPartMetadata = defaultCryptographyService.getMetaData(encryptedZipPart);
     encryptedZipParts.add(new BatchPartSendingInfo(encryptedZipPart, zipPartMetadata, (i + 1)));
 }

```

### 4. Відкриття пакетної сесії

Ініціалізація нової пакетної сесії із зазначенням:
* версії схеми рахунку-фактури: [FA(2)](faktury/schemy/FA/schemat_FA(2)_v1-0E.xsd), [FA(3)](faktury/schemy/FA/schemat_FA(3)_v1-0E.xsd) <br>
визначає, яку версію XSD система буде застосовувати для валідації рахунків-фактур, що передаються.
* зашифрованого симетричного ключа<br>
симетричний ключ шифрування XML-файлів, зашифрований публічним ключем Міністерства фінансів; рекомендується використовувати новозгенерований ключ для кожної сесії.
* метаданих ZIP-пакета та його частин: назва файлу, хеш, розмір та список частин (якщо пакет поділяється)

POST [/sessions/batch](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-wsadowa/paths/~1sessions~1batch/post)

У відповіді на відкриття сесії ми отримаємо об'єкт, що містить `referenceNumber`, який буде використовуватися в наступних кроках для ідентифікації пакетної сесії.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
Client.Core.Models.Sessions.BatchSession.OpenBatchSessionRequest openBatchRequest =
    BatchUtils.BuildOpenBatchRequest(zipMeta, encryptionData, encryptedParts, systemCode);

Client.Core.Models.Sessions.BatchSession.OpenBatchSessionResponse openBatchSessionResponse =
    await BatchUtils.OpenBatchAsync(KsefClient, openBatchRequest, accessToken).ConfigureAwait(false);

//BatchUtils.BuildOpenBatchRequest
public static OpenBatchSessionRequest BuildOpenBatchRequest(
    FileMetadata zipMeta,
    EncryptionData encryption,
    IEnumerable<BatchPartSendingInfo> encryptedParts,
    SystemCode systemCode = DefaultSystemCode,
    string schemaVersion = DefaultSchemaVersion,
    string value = DefaultValue)
{
    IOpenBatchSessionRequestBuilderBatchFile builder = OpenBatchSessionRequestBuilder
        .Create()
        .WithFormCode(systemCode: SystemCodeHelper.GetValue(systemCode), schemaVersion: schemaVersion, value: value)
        .WithBatchFile(fileSize: zipMeta.FileSize, fileHash: zipMeta.HashSHA);

    foreach (BatchPartSendingInfo p in encryptedParts)
    {
        builder = builder.AddBatchFilePart(
            ordinalNumber: p.OrdinalNumber,
            fileName: $"part_{p.OrdinalNumber}.zip.aes",
            fileSize: p.Metadata.FileSize,
            fileHash: p.Metadata.HashSHA);
    }

    return builder
        .EndBatchFile()
        .WithEncryption(
            encryptedSymmetricKey: encryption.EncryptionInfo.EncryptedSymmetricKey,
            initializationVector: encryption.EncryptionInfo.InitializationVector)
        .Build();
}

//BatchUtils.OpenBatchAsync
public static async Task<OpenBatchSessionResponse> OpenBatchAsync(
    IKSeFClient client,
    OpenBatchSessionRequest openReq,
    string accessToken)
    => await client.OpenBatchSessionAsync(openReq, accessToken).ConfigureAwait(false);
```

Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
OpenBatchSessionRequestBuilder builder = OpenBatchSessionRequestBuilder.create()
        .withFormCode(SystemCode.FA_2, SchemaVersion.VERSION_1_0E, SessionValue.FA)
        .withOfflineMode(false)
        .withBatchFile(zipMetadata.getFileSize(), zipMetadata.getHashSHA());

for (int i = 0; i < encryptedZipParts.size(); i++) {
        BatchPartSendingInfo part = encryptedZipParts.get(i);
        builder = builder.addBatchFilePart(i + 1, "faktura_part" + (i + 1) + ".zip.aes",part.getMetadata().getFileSize(), part.getMetadata().getHashSHA());
}

OpenBatchSessionRequest request = builder.endBatchFile()
        .withEncryption(
                        encryptionData.encryptionInfo().getEncryptedSymmetricKey(),
                        encryptionData.encryptionInfo().getInitializationVector()
                )
        .build();

OpenBatchSessionResponse response = ksefClient.openBatchSession(request, accessToken);
```

Метод повертає список частин пакета; для кожної частини надає адресу завантаження (URL), необхідний метод HTTP та комплект заголовків, які потрібно надіслати разом з відповідною частиною.

### 5. Надсилання заявлених частин пакета

Використовуючи дані, повернуті при відкритті сесії в `partUploadRequests`, тобто унікальну адресу url з ключем доступу, метод HTTP (method) та необхідні заголовки (headers), потрібно надіслати кожну заявлену частину пакета (`fileParts`) за вказаною адресою, застосовуючи точно ті значення для відповідної частини. З'єднанням між декларацією та інструкцією відправки є властивість `ordinalNumber`.

У тілі запиту (body) потрібно розмістити байти відповідної частини файлу (без упакування в JSON).

> Увага: не слід додавати до заголовків токен доступу (`accessToken`).

Кожну частину надсилають окремим HTTP-запитом. Коди відповіді, що повертаються:
* `201` - коректне прийняття файлу,
* `400` - помилкові дані,
* `401` - неправильна автентифікація,
* `403` - відсутність прав на запис (наприклад, минув час на запис).

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
await KsefClient.SendBatchPartsAsync(openBatchSessionResponse, encryptedParts);
```

Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
ksefClient.sendBatchParts(response, encryptedZipParts);
```

**Ліміт часу на надсилання частин у пакетній сесії**  
Відправка файлів у пакетній сесії обмежена у часі. Цей час залежить виключно від кількості заявлених частин і становить 20 хвилин на кожну частину. Кожна додаткова частина пропорційно збільшує ліміт часу **для кожної частини** в пакеті.

Загальний час на відправку кожної частини = кількість частин × 20 хвилин.  
Приклад. Пакет містить 2 частини – кожна частина має 40 хвилин на відправку.

Розмір частини не має значення для встановлення ліміту часу – єдиним критерієм є кількість частин, заявлена при відкритті сесії.  

Авторизація перевіряється на початку кожного HTTP-запиту. Якщо в момент прийняття запиту адреса є дійсною, операція передачі виконується повністю. Закінчення терміну дії під час передачі не перериває розпочату операцію.

### 6. Закриття пакетної сесії
Після надсилання всіх частин пакета потрібно закрити пакетну сесію, що ініціює асинхронну обробку пакета рахунків-фактур ([деталі верифікації](faktury/weryfikacja-faktury.md)), а також генерацію збірного UPO.

POST [/sessions/batch/\{referenceNumber\}/close](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-wsadowa/paths/~1sessions~1batch~1%7BreferenceNumber%7D~1close/post)}]

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionStreamE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionStreamE2ETests.cs)
```csharp
await KsefClient.CloseBatchSessionAsync(referenceNumber, accessToken);
```
Приклад мовою Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
ksefClient.closeBatchSession(referenceNumber, accessToken);
```

Дивіться 
- [Перевірка стану та отримання UPO](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)
- [Верифікація рахунку-фактури](faktury/weryfikacja-faktury.md)
- [Номер KSeF – структура та валідація](faktury/numer-ksef.md)
