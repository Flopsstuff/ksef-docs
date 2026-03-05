---
original: offline/korekta-techniczna.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [offline/korekta-techniczna.md](https://github.com/CIRFMF/ksef-docs/blob/main/offline/korekta-techniczna.md)

# Technical correction of offline invoice  
20.08.2025  

## Functionality description  
Technical correction enables resending an invoice issued in [offline mode](../tryby-offline.md), which after being sent to the KSeF system was **rejected** due to technical errors, e.g.:  
- non-compliance with the schema,  
- exceeding the allowed file size limit,
- invoice duplicate,
- other **technical validation errors** preventing the assignment of a ```KSeF number```.


> **Note**!
1. Technical correction **does not apply** to situations related to lack of authorization of entities appearing on the invoice (e.g. self-billing, validation of relations for JST or VAT groups).
2. In this mode, it is **not allowed** to correct the content of the invoice – technical correction applies only to technical problems preventing its acceptance in the KSeF system.
3. Technical correction can only be sent in an [interactive session](../sesja-interaktywna.md), but it can apply to offline invoices rejected both in [interactive session](../sesja-interaktywna.md) and in [batch session](../sesja-wsadowa.md).
4. It is forbidden to technically correct an offline invoice for which another correct correction has already been accepted.

## Example flow of technical correction of offline invoice  

1. **Seller issues an invoice in offline mode.**  
   - The invoice contains two QR codes:  
     - **QR Code I** – enables invoice verification in the KSeF system,  
     - **QR Code II** – enables confirmation of the issuer's authenticity based on [KSeF certificate](../certyfikaty-KSeF.md).  

2. **Customer receives invoice visualization (e.g. in print form).**  
   - After scanning **QR Code I**, the customer receives information that the invoice **has not yet been sent to the KSeF system**.  
   - After scanning **QR Code II**, the customer receives information about the KSeF certificate, which confirms the issuer's authenticity.  

3. **Seller sends the offline invoice to the KSeF system.**  
   - The KSeF system verifies the document.  
   - The invoice is **rejected** due to a technical error (e.g. incorrect compliance with XSD schema).  

4. **Seller updates their software** and generates the invoice again with the same content, but compliant with the schema.  
   - Since the XML content differs from the original version, **the SHA-256 hash of the invoice file is different**.

5. **Seller sends the corrected invoice as a technical correction.**  
   - Specifies in the `hashOfCorrectedInvoice` field the SHA-256 hash of the original, rejected offline invoice.  
   - The `offlineMode` parameter is set to `true`.  

6. **KSeF system correctly accepts the invoice.**  
   - The document receives a KSeF number.  
   - The invoice is **linked to the original offline invoice**, whose hash was specified in the `hashOfCorrectedInvoice` field.  
   - This enables redirecting the customer from the "old" QR Code I to the corrected invoice.

7. **Customer uses QR Code I placed on the original invoice.**  
   - The KSeF system informs that **the original invoice has been technically corrected**.  
   - The customer receives metadata of the new, correctly processed invoice and has the option to download it from the system.  

## Sending correction  

Correction is sent according to the principles described in the [interactive session](../sesja-interaktywna.md) document, with additional setting:  
- `offlineMode: true`,  
- `hashOfCorrectedInvoice` – hash of the original invoice.  

Example in C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)
```csharp
var sendOnlineInvoiceRequest = SendInvoiceOnlineSessionRequestBuilder
    .Create()
    .WithInvoiceHash(invoiceMetadata.HashSHA, invoiceMetadata.FileSize)
    .WithEncryptedDocumentHash(
        encryptedInvoiceMetadata.HashSHA, encryptedInvoiceMetadata.FileSize)
    .WithEncryptedDocumentContent(Convert.ToBase64String(encryptedInvoice))
    .WithOfflineMode(true)
    .WithHashOfCorrectedInvoice(hashOfCorrectedInvoice)    
    .Build();
```

Example in Java:
[OnlineSessionController#sendTechnicalCorrection.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/main/java/pl/akmf/ksef/sdk/api/OnlineSessionController.java#L120)
```java
SendInvoiceOnlineSessionRequest sendInvoiceOnlineSessionRequest = new SendInvoiceOnlineSessionRequestBuilder()
           .withInvoiceHash(invoiceMetadata.getHashSHA())
           .withInvoiceSize(invoiceMetadata.getFileSize())
           .withEncryptedInvoiceHash(encryptedInvoiceMetadata.getHashSHA())
           .withEncryptedInvoiceSize(encryptedInvoiceMetadata.getFileSize())
           .withEncryptedInvoiceContent(Base64.getEncoder().encodeToString(encryptedInvoice))
           .withOfflineMode(true)
           .withHashOfCorrectedInvoice(hashOfCorrectedInvoice)
        .build();
```

## Related documents
- [Offline modes](../tryby-offline.md)
- [QR codes](../kody-qr.md)
