---
original: tokeny-ksef.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [tokeny-ksef.md](https://github.com/CIRFMF/ksef-docs/blob/main/tokeny-ksef.md)

## Управління токенами KSeF
29.06.2025

Токен KSeF — це унікальний, згенерований ідентифікатор автентифікації, який — нарівні з [кваліфікованим електронним підписом](uwierzytelnianie.md#21-uwierzytelnianie-kwalifikowanym-podpisem-elektronicznym) — дозволяє [автентифікуватися](uwierzytelnianie.md#22-uwierzytelnianie-tokenem-ksef) до API KSeF.

```Token KSeF``` видається з незмінним набором повноважень, визначених під час його створення; будь-яка модифікація цих повноважень вимагає генерування нового токена.
> **Увага!** <br>
> ```Token KSeF``` виконує роль **конфіденційного секрету** автентифікації — його слід зберігати виключно в надійному та безпечному сховищі.


### Попередні вимоги

Генерування ```токена KSeF``` можливе виключно після одноразової автентифікації [електронним підписом (XAdES)](uwierzytelnianie.md#21-uwierzytelnianie-kwalifikowanym-podpisem-elektronicznym).

### 1. Генерування токена  

Токен може бути згенерований виключно в контексті `Nip` або `InternalId`. Генерування відбувається через виклик ендпоінту:  
POST [/tokens](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens/post)

Вказуючи в тілі запиту колекцію повноважень та опис токена.

 **Приклади реалізації:** <br>

| Поле        | Приклад значення                            | Опис                                       |
|-------------|---------------------------------------------|--------------------------------------------|
| Permissions | `["InvoiceRead", "InvoiceWrite", "CredentialsRead", "CredentialsManage"]`        | Список повноважень, призначених токену      |
| Description | `"Токен для читання рахунків-фактур і даних облікового запису"` | Опис токена                                 |


Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
 KsefTokenRequest tokenRequest = new KsefTokenRequest
    {
        Permissions = [
            KsefTokenPermissionType.InvoiceRead,
            KsefTokenPermissionType.InvoiceWrite
            ],
        Description = "Demo token",
    };
 KsefTokenResponse token = await ksefClient.GenerateKsefTokenAsync(tokenRequest, accessToken, cancellationToken);
```

Приклад мовою Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
KsefTokenRequest request = new KsefTokenRequestBuilder()
        .withDescription("test description")
        .withPermissions(List.of(TokenPermissionType.INVOICE_READ, TokenPermissionType.INVOICE_WRITE))
        .build();
GenerateTokenResponse ksefToken = ksefClient.generateKsefToken(request, authToken.accessToken());
```

### 2. Фільтрування токенів

Метадані токенів KSeF можна отримувати та фільтрувати за допомогою виклику:<br>
GET [/tokens](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens/get)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
QueryKsefTokensResponse singleResult = await KsefClient.QueryKsefTokensAsync(
    AccessToken,
    statuses: new List<AuthenticationKsefTokenStatus> {
        AuthenticationKsefTokenStatus.Pending,
        AuthenticationKsefTokenStatus.Active,
        AuthenticationKsefTokenStatus.Revoking,
        AuthenticationKsefTokenStatus.Revoked,
        AuthenticationKsefTokenStatus.Failed
    }, // за замовчуванням: null
    authorIdentifier: "authorIdentifier", // за замовчуванням: null
    authorIdentifierType: AuthenticationTokenContextIdentifierType.Nip, // або інший тип, за замовчуванням: null
    description: "description",
    continuationToken: continuationToken,
    pageSize: pageSize, // за замовчуванням: null
    cancellationToken: cancellationToken // за замовчуванням null,
    );
```

Приклад мовою Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
List<AuthenticationTokenStatus> status = List.of(AuthenticationTokenStatus.ACTIVE);
Integer pageSize = 10;
QueryTokensResponse tokens = ksefClient.queryKsefTokens(status, StringUtils.EMPTY, null, null, null, pageSize, accessToken);
```

У відповідь повертаються метадані токенів, серед іншого інформація про те, хто і в якому контексті згенерував токен KSeF та повноваження, призначені йому.

### 3. Отримання конкретного токена

Щоб отримати деталі конкретного токена, слід використати виклик:<br>
GET [/tokens/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens~1%7BreferenceNumber%7D/get)

```referenceNumber``` — це унікальний ідентифікатор токена, який можна отримати під час його створення або зі списку токенів.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
AuthenticationKsefToken token = await ksefClient.GetKsefTokenAsync(referenceNumber, accessToken, cancellationToken);
```
Приклад мовою Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
AuthenticationToken ksefToken = ksefClient.getKsefToken(token.getReferenceNumber(), accessToken);
```

### 4. Анулювання токена

Щоб анулювати токен, слід використати виклик:<br>
DELETE [/tokens/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens~1%7BreferenceNumber%7D/delete)

```referenceNumber``` — це унікальний ідентифікатор токена, який ми хочемо анулювати.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
await ksefClient.RevokeKsefTokenAsync(referenceNumber, accessToken, cancellationToken);
```

Приклад мовою Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
ksefClient.revokeKsefToken(token.getReferenceNumber(), accessToken);
```
