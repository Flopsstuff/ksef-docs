---
original: faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: d92d285
last_translated: 2026-05-23
---

> **Translation.** Original: [faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md)

## Сесія – перевірка стану та отримання УПО
20.04.2026

Цей документ описує операції, що служать для моніторингу стану сесії (інтерактивної або пакетної) та отримання УПО для рахунків-фактур і всієї сесії.

### Діаграми станів

#### Інтерактивна сесія
![діаграма станів](sesja-interaktywna-diagram-stanow.png)
#### Пакетна сесія
![діаграма станів](sesja-wsadowa-diagram-stanow.png)

### 1. Отримання списку сесій
Повертає список сесій, що відповідають заданим критеріям пошуку.

GET [sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions/get)

Повертає поточний статус сесії разом із зведеними даними про кількість надісланих, успішно та неуспішно оброблених рахунків-фактур; після закриття сесії додатково надає список посилань на зведене УПО.

Приклад мовою C#:
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

`sessionsFilter` — це об'єкт фільтрів, що знаходиться тут: [KSeF.Client.Core/Models/Sessions/SessionsFilter.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Core/Models/Sessions/SessionsFilter.cs)


Приклад мовою Java:
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

Повертає поточний статус сесії разом із зведеними даними про кількість надісланих, успішно та неуспішно оброблених рахунків-фактур; після закриття сесії додатково надає список посилань на зведене УПО.

Приклад мовою C#:
[KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)
```csharp
SessionStatusResponse openSessionResult = await kSeFClient.GetSessionStatusAsync(referenceNumber, accessToken, cancellationToken).ConfigureAwait(false);

int documentCount = openSessionResult.InvoiceCount;
int successfulInvoiceCount = openSessionResult.SuccessfulInvoiceCount;
int failedInvoiceCount = openSessionResult.FailedInvoiceCount;
```

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionStatusResponse statusResponse = ksefClient.getSessionStatus(referenceNumber, accessToken);
```


### 3. Отримання інформації про надіслані рахунки-фактури

GET [sessions/\{referenceNumber\}/invoices](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices/get)

Повертає список метаданих усіх надісланих рахунків-фактур разом із їхніми статусами та загальною кількістю цих рахунків-фактур у сесії.

Приклад мовою C#:
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

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionInvoicesResponse sessionInvoices = ksefClient.getSessionInvoices(referenceNumber,continuationtoken, pageSize, authToken);

while (Strings.isNotBlank(sessionInvoices.getContinuationToken())) {
    sessionInvoices = ksefClient.getSessions(pageSize, sessionInvoices.getContinuationToken(), accessToken);
}
```
### 4. Отримання інформації про окремий рахунок-фактуру

Дозволяє отримати детальну інформацію про окремий рахунок-фактуру в сесії, включаючи його статус і метадані.

Необхідно вказати референційний номер сесії `referenceNumber` та референційний номер рахунку-фактури `invoiceReferenceNumber`.

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D/get)

Приклад мовою C#:
```csharp
SessionInvoice invoice = await ksefClient
                .GetSessionInvoiceAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken);
```

Приклад мовою Java:
[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
SessionInvoiceStatusResponse statusResponse = ksefClient.getSessionInvoiceStatus(sessionReferenceNumber, invoiceReferenceNumber, accessToken);

```

### 5. Отримання УПО для рахунку-фактури

Дозволяє отримати УПО для окремого, коректно прийнятого рахунку-фактури.

#### 5.1 На основі референційного номера рахунку-фактури

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D~1upo/get)

Приклад мовою C#:
```csharp
string upo = await ksefClient
                .GetSessionInvoiceUpoByReferenceNumberAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken)
```

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByReferenceNumber(sessionReferenceNumber, invoiceReferenceNumber, accessToken);
```

#### 5.2 На основі номера KSeF рахунку-фактури

GET [sessions/\{referenceNumber\}/invoices/ksef/\{ksefNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1ksef~1%7BksefNumber%7D~1upo/get)

Приклад мовою C#:
```csharp
var upo = await ksefClient
                .GetSessionInvoiceUpoByKsefNumberAsync(
                referenceNumber,
                ksefNumber,
                accessToken,
                cancellationToken)
```

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByKsefNumber(sessionReferenceNumber, ksefNumber, accessToken);
```

Отриманий XML-документ є:
* підписаним у форматі XADES Міністерством фінансів
* відповідним схемі [XSD](/faktury/upo/schemy/upo-v4-3.xsd).

### 6. Отримання списку некоректно прийнятих рахунків-фактур

GET [sessions/\{referenceNumber\}/invoices/failed](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1failed/get)

Повертає загальну кількість відхилених рахунків-фактур у сесії та детальну інформацію (статус і деталі помилок) для кожного некоректно обробленого рахунку-фактури.

Приклад мовою C#:
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

Приклад мовою Java:
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

Endpoint дозволяє вибірково отримати лише відхилені рахунки-фактури, що полегшує аналіз помилок у сесіях із великою кількістю рахунків-фактур.

### 7. Отримання УПО сесії

УПО сесії є зведеним підтвердженням прийняття всіх рахунків-фактур, коректно надісланих у рамках даної сесії.

Після закриття сесії у відповідь на перевірку її [стану](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get) (крок 2 – Перевірка стану сесії) повертаються не лише дані про кількість коректно та некоректно оброблених рахунків-фактур, а й список посилань на зведені УПО.

Кожен елемент масиву `upo.pages[]` містить референційний номер УПО (`referenceNumber`) та посилання (`downloadUrl`) для його завантаження:

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

Маючи цей список, клієнт API може завантажувати УПО по одному, викликаючи endpoint, вказаний у полі `downloadUrl`, тобто  
GET [/sessions/\{referenceNumber\}/upo/\{upoReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1upo~1%7BupoReferenceNumber%7D/get)

Отриманий XML-документ відповідає схемі [XSD](/faktury/upo/schemy/upo-v4-3.xsd) і може містити максимум 10 000 позицій рахунків-фактур.

Приклад мовою C#:

```csharp
 string upo = await ksefClient.GetSessionUpoAsync(
            sessionReferenceNumber,
            upoReferenceNumber,
            accessToken,
            cancellationToken
        );
```

Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] sessionUpo = ksefClient.getSessionUpo(sessionReferenceNumber, upoReferenceNumber, accessToken);
```

## Пов'язані документи
- [Номер KSeF – структура та валідація](../numer-ksef.md)
