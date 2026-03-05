---
original: tokeny-ksef.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [tokeny-ksef.md](https://github.com/CIRFMF/ksef-docs/blob/main/tokeny-ksef.md)

## Управление токенами KSeF
29.06.2025

Токен KSeF — это уникальный сгенерированный идентификатор аутентификации, который наравне с [квалифицированной электронной подписью](uwierzytelnianie.md#21-uwierzytelnianie-kwalifikowanym-podpisem-elektronicznym) позволяет выполнить [аутентификацию](uwierzytelnianie.md#22-uwierzytelnianie-tokenem-ksef) в API KSeF.

```Token KSeF``` выдается с неизменным набором разрешений, определенных при его создании; любая модификация этих разрешений требует генерации нового токена.
> **Внимание!** <br>
> ```Token KSeF``` выполняет роль **конфиденциального секрета** аутентификации — его следует хранить исключительно в надежном и безопасном хранилище.


### Предварительные требования

Генерация ```токена KSeF``` возможна только после одноразовой аутентификации [электронной подписью (XAdES)](uwierzytelnianie.md#21-uwierzytelnianie-kwalifikowanym-podpisem-elektronicznym).

### 1. Генерация токена  

Токен может быть сгенерирован исключительно в контексте `Nip` или `InternalId`. Генерация осуществляется посредством вызова endpoint:  
POST [/tokens](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens/post)

Указывая в теле запроса коллекцию разрешений и описание токена.

 **Примеры реализации:** <br>

| Поле        | Примерное значение                         | Описание                                       |
|-------------|---------------------------------------------|--------------------------------------------|
| Permissions | `["InvoiceRead", "InvoiceWrite", "CredentialsRead", "CredentialsManage"]`        | Список разрешений, назначенных токену      |
| Description | `"Токен для чтения счетов и данных учетной записи"` | Описание токена                                 |


Пример на языке C#:
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

Пример на языке Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
KsefTokenRequest request = new KsefTokenRequestBuilder()
        .withDescription("test description")
        .withPermissions(List.of(TokenPermissionType.INVOICE_READ, TokenPermissionType.INVOICE_WRITE))
        .build();
GenerateTokenResponse ksefToken = ksefClient.generateKsefToken(request, authToken.accessToken());
```

### 2. Фильтрация токенов

Метаданные токенов KSeF можно получать и фильтровать с помощью вызова:<br>
GET [/tokens](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens/get)

Пример на языке C#:
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
    }, // по умолчанию: null
    authorIdentifier: "authorIdentifier", // по умолчанию: null
    authorIdentifierType: AuthenticationTokenContextIdentifierType.Nip, // или другой тип, по умолчанию: null
    description: "description",
    continuationToken: continuationToken,
    pageSize: pageSize, // по умолчанию: null
    cancellationToken: cancellationToken // по умолчанию null,
    );
```

Пример на языке Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
List<AuthenticationTokenStatus> status = List.of(AuthenticationTokenStatus.ACTIVE);
Integer pageSize = 10;
QueryTokensResponse tokens = ksefClient.queryKsefTokens(status, StringUtils.EMPTY, null, null, null, pageSize, accessToken);
```

В ответе возвращаются метаданные токенов, включая информацию о том, кто и в каком контексте сгенерировал токен KSeF, а также назначенные ему разрешения.

### 3. Получение конкретного токена

Для получения деталей конкретного токена следует использовать вызов:<br>
GET [/tokens/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens~1%7BreferenceNumber%7D/get)

```referenceNumber``` — это уникальный идентификатор токена, который можно получить при его создании или из списка токенов.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
AuthenticationKsefToken token = await ksefClient.GetKsefTokenAsync(referenceNumber, accessToken, cancellationToken);
```
Пример на языке Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
AuthenticationToken ksefToken = ksefClient.getKsefToken(token.getReferenceNumber(), accessToken);
```

### 4. Аннулирование токена

Для аннулирования токена следует использовать вызов:<br>
DELETE [/tokens/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens~1%7BreferenceNumber%7D/delete)

```referenceNumber``` — это уникальный идентификатор токена, который мы хотим аннулировать.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
await ksefClient.RevokeKsefTokenAsync(referenceNumber, accessToken, cancellationToken);
```

Пример на языке Java:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
ksefClient.revokeKsefToken(token.getReferenceNumber(), accessToken);
```
