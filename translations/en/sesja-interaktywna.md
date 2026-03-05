---
original: sesja-interaktywna.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [sesja-interaktywna.md](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-interaktywna.md)

## Interactive Session
10.07.2025

An interactive session is used to send individual structured invoices to the KSeF API. Each invoice must be prepared in XML format according to the current schema published by the Ministry of Finance.

### Prerequisites

To use interactive sending, you must first go through the [authentication](uwierzytelnianie.md) process and have a current access token (`accessToken`) that authorizes the use of protected KSeF API resources.

Before opening a session and sending invoices, the following is required:
* generating a symmetric key of 256 bits length and an initialization vector of 128 bits length (IV), attached as a prefix to the ciphertext,
* encrypting the document with the AES-256-CBC algorithm with PKCS#7 padding,
* encrypting the symmetric key with the RSAES-OAEP algorithm (OAEP padding with MGF1 function based on SHA-256 and SHA-256 hash), using the Ministry of Finance KSeF public key.

These operations can be performed using the `CryptographyService` component, available in the KSeF client.

Example in C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
EncryptionData encryptionData = CryptographyService.GetEncryptionData();
```
Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
EncryptionData encryptionData = cryptographyService.getEncryptionData();
```

### 1. Opening a Session

Initialization of a new interactive session with:
* invoice schema version: [FA(2)](faktury/schemy/FA/schemat_FA(2)_v1-0E.xsd), [FA(3)](faktury/schemy/FA/schemat_FA(3)_v1-0E.xsd) <br>
determines which XSD version the system will use to validate the sent invoices.
* encrypted symmetric key<br>
symmetric key for encrypting XML files, encrypted with the Ministry of Finance public key; it is recommended to use a newly generated key for each session.

Opening a session is a lightweight and synchronous operation – you can simultaneously maintain multiple open interactive sessions within one authentication.

POST [sessions/online](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online/post)

The response returns an object containing:
 - `referenceNumber` – unique identifier of the interactive session, which should be passed in all subsequent API calls.
 - `validUntil` – Session validity date. After this date expires, the session will be automatically closed. The lifetime of an interactive session is 12 hours from the moment of its creation.

Example in C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
OpenOnlineSessionRequest openOnlineSessionRequest = OpenOnlineSessionRequestBuilder
    .Create()
    .WithFormCode(systemCode: SystemCodeHelper.GetValue(systemCode), schemaVersion: DefaultSchemaVersion, value: DefaultFormCodeValue)
    .WithEncryption(
        encryptedSymmetricKey: encryptionData.EncryptionInfo.EncryptedSymmetricKey,
        initializationVector: encryptionData.EncryptionInfo.InitializationVector)
    .Build();

OpenOnlineSessionResponse openOnlineSessionResponse = await KsefClient.OpenOnlineSessionAsync(openOnlineSessionRequest, accessToken, CancellationToken);
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
OpenOnlineSessionRequest request = new OpenOnlineSessionRequestBuilder()
        .withFormCode(new FormCode(systemCode, schemaVersion, value))
        .withEncryptionInfo(encryptionData.encryptionInfo())
        .build();

OpenOnlineSessionResponse openOnlineSessionResponse = ksefClient.openOnlineSession(request, accessToken);
```

### 2. Sending an Invoice

The encrypted invoice should be sent to the endpoint:

POST [sessions/online/{referenceNumber}/invoices/](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online~1%7BreferenceNumber%7D~1invoices/post)

The response contains the document's `referenceNumber` – used to identify the invoice in subsequent operations (e.g., document lists).

After successfully sending an invoice, asynchronous invoice verification begins ([verification details](faktury/weryfikacja-faktury.md)).

Example in C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
byte[] encryptedInvoice = cryptographyService.EncryptBytesWithAES256(invoice, encryptionData.CipherKey, encryptionData.CipherIv);
FileMetadata invoiceMetadata = cryptographyService.GetMetaData(invoice);
FileMetadata encryptedInvoiceMetadata = cryptographyService.GetMetaData(encryptedInvoice);

SendInvoiceRequest sendOnlineInvoiceRequest = SendInvoiceOnlineSessionRequestBuilder
    .Create()
    .WithInvoiceHash(invoiceMetadata.HashSHA, invoiceMetadata.FileSize)
    .WithEncryptedDocumentHash(encryptedInvoiceMetadata.HashSHA, encryptedInvoiceMetadata.FileSize)
    .WithEncryptedDocumentContent(Convert.ToBase64String(encryptedInvoice))
    .Build();

SendInvoiceResponse sendInvoiceResponse = await KsefClient.SendOnlineSessionInvoiceAsync(sendOnlineInvoiceRequest, referenceNumber, accessToken);
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] invoice = "";

byte[] encryptedInvoice = defaultCryptographyService.encryptBytesWithAES256(invoice,
        encryptionData.cipherKey(),
        encryptionData.cipherIv());

FileMetadata invoiceMetadata = defaultCryptographyService.getMetaData(invoice);
FileMetadata encryptedInvoiceMetadata = defaultCryptographyService.getMetaData(encryptedInvoice);

SendInvoiceOnlineSessionRequest sendInvoiceOnlineSessionRequest = new SendInvoiceOnlineSessionRequestBuilder()
        .withInvoiceHash(invoiceMetadata.getHashSHA())
        .withInvoiceSize(invoiceMetadata.getFileSize())
        .withEncryptedInvoiceHash(encryptedInvoiceMetadata.getHashSHA())
        .withEncryptedInvoiceSize(encryptedInvoiceMetadata.getFileSize())
        .withEncryptedInvoiceContent(Base64.getEncoder().encodeToString(encryptedInvoice))
        .build();

SendInvoiceResponse sendInvoiceResponse = ksefClient.onlineSessionSendInvoice(sessionReferenceNumber, sendInvoiceOnlineSessionRequest, accessToken);

```

### 3. Closing a Session
After sending all invoices, the session should be closed, which initiates asynchronous generation of a collective UPO.

POST [/sessions/online/\{referenceNumber\}/close](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online~1%7BreferenceNumber%7D~1close/post)

The collective UPO will be available after checking the session status.

Example in C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
await KsefClient.CloseOnlineSessionAsync(referenceNumber, accessToken, CancellationToken);
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
ksefClient.closeOnlineSession(sessionReferenceNumber, accessToken);
```

Related documents:
- [Status Check and UPO Download](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)
- [Invoice Verification](faktury/weryfikacja-faktury.md)
- [KSeF Number – Structure and Validation](faktury/numer-ksef.md)
