---
original: sesja-wsadowa.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [sesja-wsadowa.md](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-wsadowa.md)

## Пакетная сессия
10.07.2025

Пакетная отправка позволяет единовременно отправить множество счетов-фактур в одном ZIP-файле, вместо отправки каждого счета-фактуры отдельно.

Это решение ускоряет и упрощает обработку большого количества документов — особенно для компаний, которые генерируют много счетов-фактур ежедневно.

Каждый счет-фактура должен быть подготовлен в формате XML согласно актуальной схеме, опубликованной Министерством финансов:
* ZIP-пакет должен быть разделен на части не больше 100 МБ (до шифрования), которые шифруются и передаются отдельно.
* Необходимо указать информацию о каждой части пакета в объекте ```fileParts```.

### Предварительные требования
Чтобы воспользоваться пакетной отправкой, необходимо сначала пройти процесс [аутентификации](uwierzytelnianie.md) и иметь актуальный токен доступа (```accessToken```), который дает право на использование защищенных ресурсов API KSeF.

**Рекомендация (корреляция статусов по `invoiceHash`)**  
Перед созданием пакета для пакетной отправки рекомендуется вычислить хеш SHA-256 для каждого XML-файла счета-фактуры (оригинал, до шифрования) и сохранить локальное сопоставление. Это позволяет однозначно связать статусы обработки со стороны KSeF с локальными исходными документами (XML), подготовленными к отправке.

Перед открытием сессии и отправкой счетов-фактур требуется:
* генерация симметричного ключа длиной 256 бит и вектора инициализации длиной 128 бит (IV), добавляемого как префикс к шифротексту,
* подготовка ZIP-пакета,
* (опционально, если пакет превышает допустимый размер) разделение ZIP-пакета на части,
* шифрование частей алгоритмом AES-256-CBC с дополнением PKCS#7,
* шифрование симметричного ключа алгоритмом RSAES-OAEP (дополнение OAEP с функцией MGF1 на основе SHA-256 и хешем SHA-256), используя публичный ключ KSeF Министерства финансов.

Эти операции можно выполнить с помощью компонента ```CryptographyService```, доступного в официальном клиенте KSeF. Эта библиотека предоставляет готовые методы для генерации и шифрования ключей согласно требованиям системы.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
EncryptionData encryptionData = cryptographyService.GetEncryptionData();
```
Пример на языке Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
EncryptionData encryptionData = cryptographyService.getEncryptionData();
```

Сгенерированные данные служат для шифрования счетов-фактур.

### 1. Подготовка ZIP-пакета
Необходимо создать ZIP-пакет, содержащий все счета-фактуры, которые будут отправлены в рамках одной сессии.

Пример на языке C#:
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

Пример на языке Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
byte[] zipBytes = FilesUtil.createZip(invoicesInMemory);

// get ZIP metadata (before crypto)
FileMetadata zipMetadata = defaultCryptographyService.getMetaData(zipBytes);
```

### 2. Бинарное разделение ZIP-пакета на части

Из-за ограничений размера передаваемых файлов ZIP-пакет должен быть разделен бинарно на меньшие части, которые будут передаваться отдельно. Каждая часть должна иметь уникальное имя и порядковый номер.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp

 // Получить метаданные ZIP (до шифрования)
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

Пример на языке Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
List<byte[]> zipParts = FilesUtil.splitZip(partsCount, zipBytes);
```

### 3. Шифрование частей пакета
Каждую часть необходимо зашифровать заново сгенерированным ключом AES‑256‑CBC с дополнением PKCS#7.

Пример на языке C#:
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
        encryptedOutput.Position = 0; // сброс после чтения для метаданных
    }

    encryptedParts.Add(new BatchPartStreamSendingInfo
    {
        DataStream = encryptedOutput,
        OrdinalNumber = i + 1,
        Metadata = partMeta
    });
}
```

Пример на языке Java:
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

### 4. Открытие пакетной сессии

Инициализация новой пакетной сессии с указанием:
* версии схемы счета-фактуры: [FA(2)](faktury/schemy/FA/schemat_FA(2)_v1-0E.xsd), [FA(3)](faktury/schemy/FA/schemat_FA(3)_v1-0E.xsd) <br>
определяет, какую версию XSD система будет применять для валидации передаваемых счетов-фактур.
* зашифрованного симметричного ключа<br>
симметричный ключ шифрования XML-файлов, зашифрованный публичным ключом Министерства финансов; рекомендуется использовать заново сгенерированный ключ для каждой сессии.
* метаданных ZIP-пакета и его частей: имя файла, хеш, размер и список частей (если пакет разделяется)

POST [/sessions/batch](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-wsadowa/paths/~1sessions~1batch/post)

В ответе на открытие сессии мы получим объект, содержащий `referenceNumber`, который будет использоваться в последующих шагах для идентификации пакетной сессии.

Пример на языке C#:
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

Пример на языке Java:
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

Метод возвращает список частей пакета; для каждой части указывает адрес загрузки (URL), требуемый HTTP-метод и полный набор заголовков, которые необходимо отправить вместе с данной частью.

### 5. Отправка объявленных частей пакета

Используя данные, возвращенные при открытии сессии в `partUploadRequests`, т.е. уникальный URL-адрес с ключом доступа, HTTP-метод (method) и требуемые заголовки (headers), необходимо отправить каждую объявленную часть пакета (`fileParts`) по указанному адресу, используя точно эти значения для данной части. Связующим звеном между объявлением и инструкцией отправки является свойство `ordinalNumber`.

В теле запроса (body) необходимо поместить байты соответствующей части файла (без упаковки в JSON).

> Внимание: не следует добавлять в заголовки токен доступа (`accessToken`).

Каждая часть отправляется отдельным HTTP-запросом. Возвращаемые коды ответа:
* `201` - корректное принятие файла,
* `400` - неверные данные,
* `401` - неправильная аутентификация,
* `403` - отсутствие прав на запись (например, истекло время на запись).

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
await KsefClient.SendBatchPartsAsync(openBatchSessionResponse, encryptedParts);
```

Пример на языке Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
ksefClient.sendBatchParts(response, encryptedZipParts);
```

**Лимит времени на отправку частей в пакетной сессии**  
Отправка файлов в пакетной сессии ограничена по времени. Это время зависит исключительно от количества объявленных частей и составляет 20 минут на каждую часть. Каждая дополнительная часть пропорционально увеличивает лимит времени **для каждой части** в пакете.

Общее время на отправку каждой части = количество частей × 20 минут.  
Пример. Пакет содержит 2 части – каждая часть имеет 40 минут на отправку.

Размер части не имеет значения для установления лимита времени – единственным критерием является количество частей, объявленное при открытии сессии.

Авторизация проверяется в начале каждого HTTP-запроса. Если в момент принятия запроса адрес действителен, операция передачи выполняется полностью. Истечение срока действия в процессе передачи не прерывает начатую операцию.

### 6. Закрытие пакетной сессии
После отправки всех частей пакета необходимо закрыть пакетную сессию, что инициирует асинхронную обработку пакета счетов-фактур ([подробности верификации](faktury/weryfikacja-faktury.md)), а также генерацию сводного UPO.

POST [/sessions/batch/\{referenceNumber\}/close](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-wsadowa/paths/~1sessions~1batch~1%7BreferenceNumber%7D~1close/post)}]

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionStreamE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionStreamE2ETests.cs)
```csharp
await KsefClient.CloseBatchSessionAsync(referenceNumber, accessToken);
```
Пример на языке Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
ksefClient.closeBatchSession(referenceNumber, accessToken);
```

Смотрите также 
- [Проверка состояния и получение UPO](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)
- [Верификация счета-фактуры](faktury/weryfikacja-faktury.md)
- [Номер KSeF – структура и валидация](faktury/numer-ksef.md)
