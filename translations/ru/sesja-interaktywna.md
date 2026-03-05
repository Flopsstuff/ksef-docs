---
original: sesja-interaktywna.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [sesja-interaktywna.md](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-interaktywna.md)

## Интерактивная сессия
10.07.2025

Интерактивная сессия служит для отправки отдельных структурированных счетов-фактур в API KSeF. Каждый счет-фактура должен быть подготовлен в формате XML в соответствии с актуальной схемой, опубликованной Министерством финансов.

### Предварительные требования

Для использования интерактивной отправки необходимо сначала пройти процесс [аутентификации](uwierzytelnianie.md) и иметь действительный токен доступа (```accessToken```), который дает право использовать защищенные ресурсы API KSeF.

Перед открытием сессии и отправкой счетов-фактур требуется:
* генерация симметричного ключа длиной 256 бит и вектора инициализации длиной 128 бит (IV), добавляемого как префикс к шифротексту,
* шифрование документа алгоритмом AES-256-CBC с дополнением PKCS#7,
* шифрование симметричного ключа алгоритмом RSAES-OAEP (padding OAEP с функцией MGF1, основанной на SHA-256 и хеше SHA-256), используя публичный ключ KSeF Министерства финансов.

Эти операции можно выполнить с помощью компонента ```CryptographyService```, доступного в клиенте KSeF.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
EncryptionData encryptionData = CryptographyService.GetEncryptionData();
```
Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
EncryptionData encryptionData = cryptographyService.getEncryptionData();
```

### 1. Открытие сессии

Инициализация новой интерактивной сессии с указанием:
* версии схемы счета-фактуры: [FA(2)](faktury/schemy/FA/schemat_FA(2)_v1-0E.xsd), [FA(3)](faktury/schemy/FA/schemat_FA(3)_v1-0E.xsd) <br>
определяет, какую версию XSD система будет применять для валидации отправляемых счетов-фактур.
* зашифрованного симметричного ключа<br>
симметричный ключ шифрования файлов XML, зашифрованный публичным ключом Министерства финансов; рекомендуется использование вновь сгенерированного ключа для каждой сессии.

Открытие сессии является легкой и синхронной операцией – можно одновременно поддерживать множество открытых интерактивных сессий в рамках одной аутентификации.

POST [sessions/online](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online/post)

В ответе возвращается объект, содержащий: 
 - ```referenceNumber``` – уникальный идентификатор интерактивной сессии, который следует передавать во всех последующих вызовах API.
 - ```validUntil``` – срок действия сессии. После его истечения сессия будет автоматически закрыта. Время жизни интерактивной сессии составляет 12 часов с момента ее создания.

Пример на языке C#:
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

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
OpenOnlineSessionRequest request = new OpenOnlineSessionRequestBuilder()
        .withFormCode(new FormCode(systemCode, schemaVersion, value))
        .withEncryptionInfo(encryptionData.encryptionInfo())
        .build();

OpenOnlineSessionResponse openOnlineSessionResponse = ksefClient.openOnlineSession(request, accessToken);
```

### 2. Отправка счета-фактуры

Зашифрованный счет-фактуру следует отправить на endpoint:

POST [sessions/online/{referenceNumber}/invoices/](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online~1%7BreferenceNumber%7D~1invoices/post)

Ответ содержит ```referenceNumber``` документа – используется для идентификации счета-фактуры в последующих операциях (например, в списках документов).

После правильной отправки счета-фактуры начинается асинхронная верификация счета-фактуры ([подробности верификации](faktury/weryfikacja-faktury.md)).

Пример на языке C#:
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

Пример на языке Java:
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

### 3. Закрытие сессии
После отправки всех счетов-фактур следует закрыть сессию, что инициирует асинхронную генерацию сводного UPO.

POST [/sessions/online/\{referenceNumber\}/close](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wysylka-interaktywna/paths/~1sessions~1online~1%7BreferenceNumber%7D~1close/post)

Сводное UPO будет доступно после проверки состояния сессии.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)

```csharp
await KsefClient.CloseOnlineSessionAsync(referenceNumber, accessToken, CancellationToken);
```

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
ksefClient.closeOnlineSession(sessionReferenceNumber, accessToken);
```

Связанные документы: 
- [Проверка состояния и получение UPO](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)
- [Верификация счета-фактуры](faktury/weryfikacja-faktury.md)
- [Номер KSeF – структура и валидация](faktury/numer-ksef.md)
