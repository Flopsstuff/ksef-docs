---
original: tokeny-ksef.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [tokeny-ksef.md](https://github.com/CIRFMF/ksef-docs/blob/main/tokeny-ksef.md)

## KSeF Token Management
29.06.2025

A KSeF token is a unique, generated authentication identifier that — alongside [qualified electronic signature](uwierzytelnianie.md#21-uwierzytelnianie-kwalifikowanym-podpisem-elektronicznym) — enables [authentication](uwierzytelnianie.md#22-uwierzytelnianie-tokenem-ksef) to the KSeF API.

A ```KSeF token``` is issued with an immutable set of permissions defined during its creation; any modification of these permissions requires generating a new token.
> **Note!** <br>
> The ```KSeF token``` serves as a **confidential authentication secret** — it should be stored exclusively in a trusted and secure repository.


### Prerequisites

Generation of a ```KSeF token``` is only possible after one-time authentication with an [electronic signature (XAdES)](uwierzytelnianie.md#21-uwierzytelnianie-kwalifikowanym-podpisem-elektronicznym).

### 1. Token Generation  

A token can only be generated within the context of `Nip` or `InternalId`. Generation is performed by calling the endpoint:  
POST [/tokens](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens/post)

Providing a collection of permissions and token description in the request body.

 **Implementation Examples:** <br>

| Field       | Example Value                               | Description                                |
|-------------|---------------------------------------------|--------------------------------------------|
| Permissions | `["InvoiceRead", "InvoiceWrite", "CredentialsRead", "CredentialsManage"]`        | List of permissions assigned to the token  |
| Description | `"Token for reading invoices and account data"` | Token description                          |


C# example:
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

Java example:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
KsefTokenRequest request = new KsefTokenRequestBuilder()
        .withDescription("test description")
        .withPermissions(List.of(TokenPermissionType.INVOICE_READ, TokenPermissionType.INVOICE_WRITE))
        .build();
GenerateTokenResponse ksefToken = ksefClient.generateKsefToken(request, authToken.accessToken());
```

### 2. Token Filtering

KSeF token metadata can be retrieved and filtered using the call:<br>
GET [/tokens](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens/get)

C# example:
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
    }, // default: null
    authorIdentifier: "authorIdentifier", // default: null
    authorIdentifierType: AuthenticationTokenContextIdentifierType.Nip, // or other type, default: null
    description: "description",
    continuationToken: continuationToken,
    pageSize: pageSize, // default: null
    cancellationToken: cancellationToken // default null,
    );
```

Java example:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
List<AuthenticationTokenStatus> status = List.of(AuthenticationTokenStatus.ACTIVE);
Integer pageSize = 10;
QueryTokensResponse tokens = ksefClient.queryKsefTokens(status, StringUtils.EMPTY, null, null, null, pageSize, accessToken);
```

The response returns token metadata, including information about who generated the KSeF token and in what context, as well as the permissions assigned to it.

### 3. Retrieving a Specific Token

To retrieve details of a specific token, use the call:<br>
GET [/tokens/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens~1%7BreferenceNumber%7D/get)

```referenceNumber``` is the unique token identifier that can be obtained during its creation or from the token list.

C# example:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
AuthenticationKsefToken token = await ksefClient.GetKsefTokenAsync(referenceNumber, accessToken, cancellationToken);
```
Java example:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
AuthenticationToken ksefToken = ksefClient.getKsefToken(token.getReferenceNumber(), accessToken);
```

### 4. Token Revocation

To revoke a token, use the call:<br>
DELETE [/tokens/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Tokeny-KSeF/paths/~1tokens~1%7BreferenceNumber%7D/delete)

```referenceNumber``` is the unique identifier of the token we want to revoke.

C# example:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)
```csharp
await ksefClient.RevokeKsefTokenAsync(referenceNumber, accessToken, cancellationToken);
```

Java example:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
ksefClient.revokeKsefToken(token.getReferenceNumber(), accessToken);
```
