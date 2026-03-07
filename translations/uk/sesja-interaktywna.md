---
original: sesja-interaktywna.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [sesja-interaktywna.md](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-interaktywna.md)

## Інтерактивна сесія
10.07.2025

Інтерактивна сесія служить для пересилання окремих структурованих рахунків-фактур до API KSeF. Кожна фактура повинна бути підготовлена у форматі XML відповідно до актуальної схеми, опублікованої Міністерством фінансів.

### Попередні вимоги

Щоб скористатися інтерактивною відправкою, необхідно спершу пройти процес [автентифікації](uwierzytelnianie.md) та мати актуальний токен доступу (```accessToken```), який надає право використовувати захищені ресурси API KSeF.

Перед відкриттям сесії та відправленням фактур потрібно:
* згенерувати симетричний ключ довжиною 256 біт та вектор ініціалізації довжиною 128 біт (IV), який додається як префікс до шифротексту,
* зашифрувати документ алгоритмом AES-256-CBC з доповненням PKCS#7,
* зашифрувати симетричний ключ алгоритмом RSAES-OAEP (padding OAEP з функцією MGF1 на основі SHA-256 та хешем SHA-256), використовуючи відкритий ключ KSeF Міністерства фінансів.

Ці операції можна реалізувати за допомогою компонента ```CryptographyService```, доступного в клієнті KSeF.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
EncryptionData encryptionData = CryptographyService.GetEncryptionData();
```
Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
EncryptionData encryptionData = cryptographyService.getEncryptionData();
```

### 1. Відкриття сесії

Ініціалізація нової інтерактивної сесії з вказанням:
* версії схеми фактури: [FA(2)](faktury/schemy/FA/schemat_FA(2)_v1-0E.xsd), [FA(3)](faktury/schemy/FA/schemat_FA(3)_v1-0E.xsd) <br>
визначає, яку версію XSD система буде застосовувати для валідації переданих фактур.
* зашифрованого симетричного ключа<br>
симетричний ключ для шифрування XML файлів, зашифрований відкритим ключем Міністерства фінансів; рекомендується використовувати новий ключ для кожної сесії.

Відкриття сесії є легкою та синхронною операцією – можна одночасно підтримувати багато відкритих інтерактивних сесій в рамках однієї автентифікації.

POST [sessions/online](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online/post)

У відповіді повертається об'єкт, що містить: 
 - ```referenceNumber``` – унікальний ідентифікатор інтерактивної сесії, який необхідно передавати у всіх наступних викликах API.
 - ```validUntil``` – Термін дійсності сесії. Після його закінчення сесія буде автоматично закрита. Час життя інтерактивної сесії становить 12 годин з моменту її створення.

Приклад мовою C#:
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

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
OpenOnlineSessionRequest request = new OpenOnlineSessionRequestBuilder()
        .withFormCode(new FormCode(systemCode, schemaVersion, value))
        .withEncryptionInfo(encryptionData.encryptionInfo())
        .build();

OpenOnlineSessionResponse openOnlineSessionResponse = ksefClient.openOnlineSession(request, accessToken);
```

### 2. Відправлення фактури

Зашифровану фактуру необхідно надіслати на endpoint:

POST [sessions/online/{referenceNumber}/invoices/](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online~1%7BreferenceNumber%7D~1invoices/post)

Відповідь містить ```referenceNumber``` документа – використовується для ідентифікації фактури в наступних операціях (напр. списки документів).

Після правильної передачі фактури розпочинається асинхронна верифікація фактури ([деталі верифікації](faktury/weryfikacja-faktury.md)).

Приклад мовою C#:
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

Приклад мовою Java:
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

### 3. Закриття сесії
Після відправлення всіх фактур необхідно закрити сесію, що ініціює асинхронне генерування збіркового УПО.

POST [/sessions/online/\{referenceNumber\}/close](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online~1%7BreferenceNumber%7D~1close/post)

Збіркове УПО буде доступне після перевірки стану сесії.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
await KsefClient.CloseOnlineSessionAsync(referenceNumber, accessToken, CancellationToken);
```

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
ksefClient.closeOnlineSession(sessionReferenceNumber, accessToken);
```

Пов'язані документи: 
- [Перевірка стану та отримання УПО](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)
- [Верифікація фактури](faktury/weryfikacja-faktury.md)
- [Номер KSeF – структура та валідація](faktury/numer-ksef.md)
