---
original: faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)

## Сесія – перевірка стану та отримання UPO
10.07.2025

Цей документ описує операції для моніторингу стану сесії (інтерактивної чи пакетної) та отримання UPO для рахунків-фактур та всієї сесії.

### 1. Отримання списку сесій
Повертає список сесій, що відповідають заданим критеріям пошуку.

GET [sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions/get)

Повертає поточний статус сесії разом з агрегованими даними про кількість переданих, коректно та некоректно оброблених рахунків-фактур; після закриття сесії додатково надає список посилань на збірне UPO.

Приклад на мові C#:
[KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs)
```csharp
// Отримання пакетних сесій
 List<Session> sessions = new List<Session>();
 const int pageSize = 20;
 string? continuationToken = null;
 do
 {
     SessionsListResponse response = await ksefClient.GetSessionsAsync(SessionType.Batch, accessToken, pageSize, continuationToken, sessionsFilter, cancellationToken).ConfigureAwait(false);
     continuationToken = response.ContinuationToken;
     sessions.AddRange(response.Sessions);
 } while (!string.IsNullOrEmpty(continuationToken));

// Отримання інтерактивних сесій
 List<Session> sessions = new List<Session>();
 const int pageSize = 20;
 string? continuationToken = null;
 do
 {
     SessionsListResponse response = await ksefClient.GetSessionsAsync(SessionType.Online, accessToken, pageSize, continuationToken, sessionsFilter, cancellationToken).ConfigureAwait(false);
     continuationToken = response.ContinuationToken;
     sessions.AddRange(response.Sessions);
 } while (!string.IsNullOrEmpty(continuationToken)); 
```

`sessionsFilter` це об'єкт фільтрів, що знаходиться тут: [KSeF.Client.Core/Models/Sessions/SessionsFilter.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Core/Models/Sessions/SessionsFilter.cs)


Приклад на мові Java:
[SessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SessionIntegrationTest.java)

```java
SessionsQueryRequest request = new SessionsQueryRequest();
request.setSessionType(SessionType.ONLINE);
request.setStatuses(List.of(CommonSessionStatus.INPROGRESS));

SessionsQueryResponse sessionsQueryResponse = ksefClient.getSessions(request, pageSize, continuationToken, accessToken();

while (Strings.isNotBlank(activeSessions.getContinuationToken())) {
        sessionsQueryResponse = ksefClient.getSessions(pageSize, sessionsQueryResponse.getContinuationToken(), accessToken);
}
```

### 2. Перевірка стану сесії
Перевіряє поточний стан сесії.

GET [sessions/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get)

Повертає поточний статус сесії разом з агрегованими даними про кількість переданих, коректно та некоректно оброблених рахунків-фактур; після закриття сесії додатково надає список посилань на збірне UPO.

Приклад на мові C#:
[KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)
```csharp
SessionStatusResponse openSessionResult = await kSeFClient.GetSessionStatusAsync(referenceNumber, accessToken, cancellationToken).ConfigureAwait(false);

int documentCount = openSessionResult.InvoiceCount;
int successfulInvoiceCount = openSessionResult.SuccessfulInvoiceCount;
int failedInvoiceCount = openSessionResult.FailedInvoiceCount;
```

Приклад на мові Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionStatusResponse statusResponse = ksefClient.getSessionStatus(referenceNumber, accessToken);
```


### 3. Отримання інформації про передані рахунки-фактури

GET [sessions/\{referenceNumber\}/invoices](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices/get)

Повертає список метаданих всіх переданих рахунків-фактур разом з їх статусами та загальну кількість цих рахунків-фактур у сесії.

Приклад на мові C#:
```csharp
const int pageSize = 50;
string continuationtoken = null;

do
{
    SessionInvoicesResponse sessionInvoices = await ksefClient
                                .GetSessionInvoicesAsync(
                                referenceNumber,
                                accessToken,
                                pageOffset,
                                pageSize,
                                cancellationToken)
                                ConfigureAwait(false);

    foreach (SessionInvoice sessionInvoice in sessionInvoices.Invoices)
    {
        Console.WriteLine($"#{sessionInvoice.InvoiceNumber}. Status: {sessionInvoice.Status.Code}");
    }

    continuationtoken = sessionInvoices.ContinuationToken;
}
while (continuationtoken != null);

```

Приклад на мові Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionInvoicesResponse sessionInvoices = ksefClient.getSessionInvoices(referenceNumber,continuationtoken, pageSize, authToken);

while (Strings.isNotBlank(sessionInvoices.getContinuationToken())) {
    sessionInvoices = ksefClient.getSessions(pageSize, sessionInvoices.getContinuationToken(), accessToken);
}
```
### 4. Отримання інформації про окремий рахунок-фактуру

Дозволяє отримати детальну інформацію про окремий рахунок-фактуру в сесії, включаючи його статус та метадані.

Необхідно вказати референсний номер сесії `referenceNumber` та референсний номер рахунка-фактури `invoiceReferenceNumber`.

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D/get)

Приклад на мові C#:
```csharp
SessionInvoice invoice = await ksefClient
                .GetSessionInvoiceAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken);
```

Приклад на мові Java:
[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
SessionInvoiceStatusResponse statusResponse = ksefClient.getSessionInvoiceStatus(sessionReferenceNumber, invoiceReferenceNumber, accessToken);

```

### 5. Отримання UPO для рахунка-фактури

Дозволяє отримати UPO для окремого, коректно прийнятого рахунка-фактури.

#### 5.1 На основі референсного номера рахунка-фактури

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D~1upo/get)

Приклад на мові C#:
```csharp
string upo = await ksefClient
                .GetSessionInvoiceUpoByReferenceNumberAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken)
```

Приклад на мові Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByReferenceNumber(sessionReferenceNumber, invoiceReferenceNumber, accessToken);
```

#### 5.2 На основі номера KSeF рахунка-фактури

GET [sessions/\{referenceNumber\}/invoices/ksef/\{ksefNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1ksef~1%7BksefNumber%7D~1upo/get)

Приклад на мові C#:
```csharp
var upo = await ksefClient
                .GetSessionInvoiceUpoByKsefNumberAsync(
                referenceNumber,
                ksefNumber,
                accessToken,
                cancellationToken)
```

Приклад на мові Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByKsefNumber(sessionReferenceNumber, ksefNumber, accessToken);
```

Отриманий документ XML:
* підписаний у форматі XADES Міністерством фінансів
* відповідає схемі [XSD](/faktury/upo/schemy/upo-v4-3.xsd).

### 6. Отримання списку некоректно прийнятих рахунків-фактур

GET [sessions/\{referenceNumber\}/invoices/failed](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1failed/get)

Повертає загальну кількість відхилених рахунків-фактур у сесії та детальну інформацію (статус та деталі помилок) для кожного некоректно обробленого рахунка-фактури.

Приклад на мові C#:
```csharp
const int pageSize = 50;
string continuationToken = "";

do
{
    List<SessionInvoicesResponse> sessionInvoices = await ksefClient
                                .GetSessionFailedInvoicesAsync(
                                referenceNumber,
                                accessToken,
                                pageSize,
                                continuationToken,
                                cancellationToken);

    continuationToken = failedResult.Invoices.ContinuationToken

}
while (!string.IsNullOrEmpty(continuationToken));
```

Приклад на мові Java:
[DuplicateInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/DuplicateInvoiceIntegrationTest.java)

```java
List<SessionInvoiceStatusResponse> failedInvoicesList = new ArrayList<>();
SessionInvoicesResponse failedInvoices = ksefClient.getSessionFailedInvoices(sessionRef, null, 10, accessToken);
if (failedInvoices.getInvoices() != null && !failedInvoices.getInvoices().isEmpty()) {
    failedInvoicesList.addAll(failedInvoices.getInvoices());
}
while (Strings.isNotBlank(failedInvoices.getContinuationToken())) {
    failedInvoices = ksefClient.getSessionFailedInvoices(sessionRef, failedInvoices.getContinuationToken(), 10, accessToken);
    if (failedInvoices.getInvoices() != null && !failedInvoices.getInvoices().isEmpty()) {
        failedInvoicesList.addAll(failedInvoices.getInvoices());
    }
}
```

Endpoint дозволяє селективно отримати виключно відхилені рахунки-фактури, що спрощує аналіз помилок у сесіях, що містять велику кількість рахунків-фактур.

### 7. Отримання UPO сесії

UPO сесії є збірним підтвердженням прийняття всіх рахунків-фактур, коректно переданих в рамках даної сесії.

Після закриття сесії, у відповіді на перевірку її [стану](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get) (крок 2 – Перевірка стану сесії), повертається не лише інформація про кількість коректно та помилково оброблених рахунків-фактур, а й список посилань на збірні UPO.

Кожен елемент масиву `upo.pages[]` містить референсний номер UPO (`referenceNumber`) та посилання (`downloadUrl`), що дозволяє його завантажити:

```json
"upo": {
    "pages": [
        {
            "referenceNumber": "20250901-EU-47FDBE3000-5961A5D232-BF",
            "downloadUrl": "/api/v2/sessions/20250901-SB-47FA636000-5960B49115-9D/upo/20250901-EU-47FDBE3000-5961A5D232-BF"
        },
        {
            "referenceNumber": "20250901-EU-48D8488000-59667BB54C-C8",
            "downloadUrl": "/api/v2/sessions/20250901-SB-47FA636000-5960B49115-9D/upo/20250901-EU-48D8488000-59667BB54C-C8"
        }        
    ]
}

```

Маючи цей список, клієнт API може завантажити UPO окремо, викликавши endpoint, вказаний у полі `downloadUrl`, тобто  
GET [/sessions/\{referenceNumber\}/upo/\{upoReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1upo~1%7BupoReferenceNumber%7D/get)

Отриманий документ XML відповідає схемі [XSD](/faktury/upo/schemy/upo-v4-3.xsd) і може містити максимум 10 000 позицій рахунків-фактур.

Приклад на мові C#:

```csharp
 string upo = await ksefClient.GetSessionUpoAsync(
            sessionReferenceNumber,
            upoReferenceNumber,
            accessToken,
            cancellationToken
        );
```

Приклад на мові Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] sessionUpo = ksefClient.getSessionUpo(sessionReferenceNumber, upoReferenceNumber, accessToken);
```

## Пов'язані документи
- [Номер KSeF – структура та валідація](numer-ksef.md)
