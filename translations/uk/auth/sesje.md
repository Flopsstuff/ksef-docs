---
original: auth/sesje.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [auth/sesje.md](https://github.com/CIRFMF/ksef-docs/blob/main/auth/sesje.md)

## Керування сеансами автентифікації
10.07.2025

### Отримання списку активних сеансів автентифікації

Повертає список активних сеансів автентифікації.

GET [/auth/sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Aktywne-sesje/paths/~1auth~1sessions/get)

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core/E2E/Authorization/Sessions/SessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Authorization/Sessions/SessionE2ETests.cs)
```csharp
const int pageSize = 20;
string continuationToken = string.Empty;
List<AuthenticationListItem> authenticationListItems = [];

do
{
    AuthenticationListResponse page = await ActiveSessionsClient.GetActiveSessions(accessToken, pageSize, continuationToken, CancellationToken.None);
    continuationToken = page.ContinuationToken;
    if (page.Items != null)
    {
        authenticationListItems.AddRange(page.Items);
    }
}
while (!string.IsNullOrWhiteSpace(continuationToken));
```

Приклад мовою ```Java```:
[SessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SessionIntegrationTest.java)

```java
int pageSize = 10;
AuthenticationListResponse activeSessions = createKSeFClient().getActiveSessions(10, null, accessToken);
while (Strings.isNotBlank(activeSessions.getContinuationToken())) {
    activeSessions = createKSeFClient().getActiveSessions(10, activeSessions.getContinuationToken(), accessToken);
}
```

### Анулювання поточного сеансу

DELETE [`/auth/sessions/current`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Aktywne-sesje/paths/~1auth~1sessions~1current/delete)

Анулює сеанс, пов'язаний з токеном, використаним для виклику цього endpoint'а. Після операції:
- пов'язаний ```refreshToken``` стає недійсним,
- активні ```accessTokeny``` залишаються дійсними до закінчення терміну їх дії.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core/E2E/Authorization/Sessions/SessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Authorization/Sessions/SessionE2ETests.cs)
```csharp
await ksefClient.RevokeCurrentSessionAsync(token, cancellationToken);
```

Приклад мовою ```Java```:
[SessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SessionIntegrationTest.java)

```java
createKSeFClient().revokeCurrentSession(accessToken);
```

### Анулювання обраного сеансу

DELETE [`/auth/sessions/{referenceNumber}`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Aktywne-sesje/paths/~1auth~1sessions~1%7BreferenceNumber%7D/delete)

Анулює сеанс із зазначеним референційним номером. Після операції:
- пов'язаний ```refreshToken``` стає недійсним,
- активні ```accessTokeny``` залишаються дійсними до закінчення терміну їх дії.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core/E2E/Authorization/Sessions/SessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Authorization/Sessions/SessionE2ETests.cs)
```csharp
await ksefClient.RevokeSessionAsync(referenceNumber, accessToken, cancellationToken);
```

Приклад мовою ```Java```:
[SessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SessionIntegrationTest.java)

```java
createKSeFClient().revokeSession(secondSessionReferenceNumber, firstAccessTokensPair.accessToken());
```
