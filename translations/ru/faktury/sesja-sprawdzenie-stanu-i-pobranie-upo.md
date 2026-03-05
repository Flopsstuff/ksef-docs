---
original: faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)

## Сессия – проверка состояния и получение UPO
10.07.2025

Данный документ описывает операции для мониторинга состояния сессии (интерактивной или пакетной) и получения UPO для счетов-фактур и всей сессии.

### 1. Получение списка сессий
Возвращает список сессий, удовлетворяющих заданным критериям поиска.

GET [sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions/get)

Возвращает текущий статус сессии вместе с агрегированными данными о количестве переданных, корректно и некорректно обработанных счетов-фактур; после закрытия сессии дополнительно предоставляет список ссылок на сводный UPO.

Пример на языке C#:
[KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs)
```csharp
// Получение пакетных сессий
 List<Session> sessions = new List<Session>();
 const int pageSize = 20;
 string? continuationToken = null;
 do
 {
     SessionsListResponse response = await ksefClient.GetSessionsAsync(SessionType.Batch, accessToken, pageSize, continuationToken, sessionsFilter, cancellationToken).ConfigureAwait(false);
     continuationToken = response.ContinuationToken;
     sessions.AddRange(response.Sessions);
 } while (!string.IsNullOrEmpty(continuationToken));

// Получение интерактивных сессий
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

`sessionsFilter` это объект фильтров, находящийся здесь: [KSeF.Client.Core/Models/Sessions/SessionsFilter.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Core/Models/Sessions/SessionsFilter.cs)


Пример на языке Java:
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

### 2. Проверка состояния сессии
Проверяет текущее состояние сессии.

GET [sessions/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get)

Возвращает текущий статус сессии вместе с агрегированными данными о количестве переданных, корректно и некорректно обработанных счетов-фактур; после закрытия сессии дополнительно предоставляет список ссылок на сводный UPO.

Пример на языке C#:
[KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)
```csharp
SessionStatusResponse openSessionResult = await kSeFClient.GetSessionStatusAsync(referenceNumber, accessToken, cancellationToken).ConfigureAwait(false);

int documentCount = openSessionResult.InvoiceCount;
int successfulInvoiceCount = openSessionResult.SuccessfulInvoiceCount;
int failedInvoiceCount = openSessionResult.FailedInvoiceCount;
```

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionStatusResponse statusResponse = ksefClient.getSessionStatus(referenceNumber, accessToken);
```


### 3. Получение информации о переданных счетах-фактурах

GET [sessions/\{referenceNumber\}/invoices](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices/get)

Возвращает список метаданных всех переданных счетов-фактур вместе с их статусами и общим количеством этих счетов-фактур в сессии.

Пример на языке C#:
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

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionInvoicesResponse sessionInvoices = ksefClient.getSessionInvoices(referenceNumber,continuationtoken, pageSize, authToken);

while (Strings.isNotBlank(sessionInvoices.getContinuationToken())) {
    sessionInvoices = ksefClient.getSessions(pageSize, sessionInvoices.getContinuationToken(), accessToken);
}
```
### 4. Получение информации об отдельном счете-фактуре

Позволяет получить подробную информацию об отдельном счете-фактуре в сессии, включая его статус и метаданные.

Необходимо указать референсный номер сессии `referenceNumber` и референсный номер счета-фактуры `invoiceReferenceNumber`.

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D/get)

Пример на языке C#:
```csharp
SessionInvoice invoice = await ksefClient
                .GetSessionInvoiceAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken);
```

Пример на языке Java:
[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
SessionInvoiceStatusResponse statusResponse = ksefClient.getSessionInvoiceStatus(sessionReferenceNumber, invoiceReferenceNumber, accessToken);

```

### 5. Получение UPO для счета-фактуры

Позволяет получить UPO для отдельного корректно принятого счета-фактуры.

#### 5.1 На основе референсного номера счета-фактуры

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D~1upo/get)

Пример на языке C#:
```csharp
string upo = await ksefClient
                .GetSessionInvoiceUpoByReferenceNumberAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken)
```

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByReferenceNumber(sessionReferenceNumber, invoiceReferenceNumber, accessToken);
```

#### 5.2 На основе номера KSeF счета-фактуры

GET [sessions/\{referenceNumber\}/invoices/ksef/\{ksefNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1ksef~1%7BksefNumber%7D~1upo/get)

Пример на языке C#:
```csharp
var upo = await ksefClient
                .GetSessionInvoiceUpoByKsefNumberAsync(
                referenceNumber,
                ksefNumber,
                accessToken,
                cancellationToken)
```

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByKsefNumber(sessionReferenceNumber, ksefNumber, accessToken);
```

Полученный XML-документ:
* подписан в формате XADES Министерством финансов
* соответствует схеме [XSD](/faktury/upo/schemy/upo-v4-3.xsd).

### 6. Получение списка некорректно принятых счетов-фактур

GET [sessions/\{referenceNumber\}/invoices/failed](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1failed/get)

Возвращает общее количество отклоненных счетов-фактур в сессии и подробную информацию (статус и детали ошибок) для каждого некорректно обработанного счета-фактуры.

Пример на языке C#:
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

Пример на языке Java:
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

Endpoint позволяет селективно получить только отклоненные счета-фактуры, что облегчает анализ ошибок в сессиях, содержащих большое количество счетов-фактур.

### 7. Получение UPO сессии

UPO сессии представляет собой сводное подтверждение принятия всех корректно переданных счетов-фактур в рамках данной сессии.

После закрытия сессии в ответе на проверку ее [состояния](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get) (шаг 2 – Проверка состояния сессии) возвращается не только информация о количестве корректно и ошибочно обработанных счетов-фактур, но также список ссылок на сводные UPO.

Каждый элемент массива `upo.pages[]` содержит референсный номер UPO (`referenceNumber`) и ссылку (`downloadUrl`), позволяющую его скачать:

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

Имея этот список, клиент API может скачать UPO по отдельности, вызвав endpoint, указанный в поле `downloadUrl`, т.е.  
GET [/sessions/\{referenceNumber\}/upo/\{upoReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1upo~1%7BupoReferenceNumber%7D/get)

Полученный XML-документ соответствует схеме [XSD](/faktury/upo/schemy/upo-v4-3.xsd) и может содержать максимум 10 000 позиций счетов-фактур.

Пример на языке C#:

```csharp
 string upo = await ksefClient.GetSessionUpoAsync(
            sessionReferenceNumber,
            upoReferenceNumber,
            accessToken,
            cancellationToken
        );
```

Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] sessionUpo = ksefClient.getSessionUpo(sessionReferenceNumber, upoReferenceNumber, accessToken);
```

## Связанные документы
- [Номер KSeF – структура и валидация](numer-ksef.md)
