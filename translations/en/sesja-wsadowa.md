---
original: sesja-wsadowa.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [sesja-wsadowa.md](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-wsadowa.md)

## Batch session
10.07.2025

Batch sending enables one-time submission of multiple invoices in a single ZIP file, instead of sending each invoice separately.

This solution speeds up and facilitates processing of large numbers of documents — especially for companies that generate many invoices daily.

Each invoice must be prepared in XML format according to the current schema published by the Ministry of Finance:
* The ZIP package should be divided into parts no larger than 100 MB (before encryption), which are encrypted and sent separately.
* Information about each package part must be provided in the ```fileParts``` object.


### Prerequisites
To use batch sending, you must first go through the [authentication](uwierzytelnianie.md) process and have a current access token (```accessToken```), which authorizes the use of protected KSeF API resources.

**Recommendation (status correlation by `invoiceHash`)**  
Before creating a package for batch sending, it is recommended to calculate the SHA-256 hash for each invoice XML file (original, before encryption) and save local mapping. This enables unambiguous linking of processing statuses on the KSeF side with local source documents (XML) prepared for sending.

Before opening a session and sending invoices, the following is required:
* generating a symmetric key with a length of 256 bits and an initialization vector with a length of 128 bits (IV), added as a prefix to the ciphertext,
* preparing a ZIP package,
* (optionally, if the package exceeds the allowed size) dividing the ZIP package into parts,
* encrypting parts with the AES-256-CBC algorithm with PKCS#7 padding,
* encrypting the symmetric key with the RSAES-OAEP algorithm (OAEP padding with MGF1 function based on SHA-256 and SHA-256 hash), using the KSeF Ministry of Finance public key.

These operations can be performed using the ```CryptographyService``` component, available in the official KSeF client. This library provides ready-made methods for generating and encrypting keys, in accordance with system requirements.

Example in C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
EncryptionData encryptionData = cryptographyService.GetEncryptionData();
```
Example in Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
EncryptionData encryptionData = cryptographyService.getEncryptionData();
```

The generated data is used to encrypt invoices.

### 1. ZIP package preparation
You need to create a ZIP package containing all invoices that will be sent within one session.  

Example in C#:
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

Example in Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
byte[] zipBytes = FilesUtil.createZip(invoicesInMemory);

// get ZIP metadata (before crypto)
FileMetadata zipMetadata = defaultCryptographyService.getMetaData(zipBytes);
```

### 2. Binary division of ZIP package into parts

Due to limitations on the size of transmitted files, the ZIP package should be divided binarily into smaller parts, which will be sent separately. Each part should have a unique name and ordinal number.

Example in C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp

 // Get ZIP metadata (before encryption)
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

Example in Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
List<byte[]> zipParts = FilesUtil.splitZip(partsCount, zipBytes);
```

### 3. Encryption of package parts
Each part should be encrypted with a newly generated AES-256-CBC key with PKCS#7 padding.

Example in C#:
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
        encryptedOutput.Position = 0; // reset after reading for metadata
    }

    encryptedParts.Add(new BatchPartStreamSendingInfo
    {
        DataStream = encryptedOutput,
        OrdinalNumber = i + 1,
        Metadata = partMeta
    });
}
```

Example in Java:
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

### 4. Opening batch session

Initialize a new batch session by providing:
* invoice schema version: [FA(2)](faktury/schemy/FA/schemat_FA(2)_v1-0E.xsd), [FA(3)](faktury/schemy/FA/schemat_FA(3)_v1-0E.xsd) <br>
specifies which XSD version the system will use to validate transmitted invoices.
* encrypted symmetric key<br>
symmetric key encrypting XML files, encrypted with the Ministry of Finance public key; it is recommended to use a newly generated key for each session.
* ZIP package metadata and its parts: file name, hash, size and list of parts (if the package is divided)

POST [/sessions/batch](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-wsadowa/paths/~1sessions~1batch/post)

In response to opening a session, we will receive an object containing `referenceNumber`, which will be used in subsequent steps to identify the batch session.

Example in C#:
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

Example in Java:
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

The method returns a list of package parts; for each part it provides the upload address (URL), required HTTP method and complete set of headers that must be sent along with the given part.

### 5. Sending declared package parts

Using the data returned when opening the session in `partUploadRequests`, i.e., the unique url address with access key, HTTP method (method) and required headers (headers), you must send each declared package part (`fileParts`) to the indicated address, using exactly these values for the given part. The link between the declaration and the sending instruction is the `ordinalNumber` property.

In the request body, you should place the bytes of the appropriate file part (without JSON wrapping).

> Note: you should not add the access token (`accessToken`) to the headers.

Each part is sent with a separate HTTP request. Returned response codes:
* `201` - correct file acceptance,
* `400` - incorrect data,
* `401` - invalid authentication,
* `403` - no write permissions (e.g., write time expired).

Example in C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionE2ETests.cs)

```csharp
await KsefClient.SendBatchPartsAsync(openBatchSessionResponse, encryptedParts);
```

Example in Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
ksefClient.sendBatchParts(response, encryptedZipParts);
```

**Time limit for sending parts in batch session**  
File sending in batch session is time-limited. This time depends solely on the number of declared parts and is 20 minutes per part. Each additional part proportionally increases the time limit **for each part** in the package.

Total time to send each part = number of parts × 20 minutes.  
Example. Package contains 2 parts – each part has 40 minutes to send.

The size of the part does not matter for determining the time limit – the only criterion is the number of parts declared when opening the session.  

Authorization is verified at the beginning of each HTTP request. If the address is valid at the time the request is accepted, the transfer operation is completed in full. Expiry during transmission does not interrupt the started operation.

### 6. Closing batch session
After sending all package parts, you must close the batch session, which asynchronously initiates processing of the invoice package ([verification details](faktury/weryfikacja-faktury.md)), and generates a collective UPO.

POST [/sessions/batch/\{referenceNumber\}/close](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-wsadowa/paths/~1sessions~1batch~1%7BreferenceNumber%7D~1close/post)}]

Example in C#:
[KSeF.Client.Tests.Core\E2E\BatchSession\BatchSessionStreamE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/BatchSession/BatchSessionStreamE2ETests.cs)
```csharp
await KsefClient.CloseBatchSessionAsync(referenceNumber, accessToken);
```
Example in Java:
[BatchIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/BatchIntegrationTest.java)

```java
ksefClient.closeBatchSession(referenceNumber, accessToken);
```

See 
- [Status checking and UPO retrieval](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)
- [Invoice verification](faktury/weryfikacja-faktury.md)
- [KSeF number – structure and validation](faktury/numer-ksef.md)
