---
original: faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: d92d285
last_translated: 2026-05-23
---

> **Translation.** Original: [faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md)

## Session – Checking Status and Downloading UPO
20.04.2026

This document describes operations for monitoring the status of a session (interactive or batch) and downloading UPO for invoices and an entire session.

### State Diagrams

#### Interactive Session
![state diagram](sesja-interaktywna-diagram-stanow.png)
#### Batch Session
![state diagram](sesja-wsadowa-diagram-stanow.png)

### 1. Retrieving the Session List
Returns a list of sessions matching the specified search criteria.

GET [sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions/get)

Returns the current status of the session along with aggregated data on the number of submitted, successfully and unsuccessfully processed invoices; after the session is closed, it additionally provides a list of references to the consolidated UPO.

Example in C#:
[KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs)
```csharp
// Retrieving batch sessions
 List<Session> sessions = new List<Session>();
 const int pageSize = 20;
 string? continuationToken = null;
 do
 {
     SessionsListResponse response = await ksefClient.GetSessionsAsync(SessionType.Batch, accessToken, pageSize, continuationToken, sessionsFilter, cancellationToken).ConfigureAwait(false);
     continuationToken = response.ContinuationToken;
     sessions.AddRange(response.Sessions);
 } while (!string.IsNullOrEmpty(continuationToken));

// Retrieving interactive sessions
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

`sessionsFilter` is a filter object located here: [KSeF.Client.Core/Models/Sessions/SessionsFilter.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Core/Models/Sessions/SessionsFilter.cs)


Example in Java:
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

### 2. Checking Session Status
Checks the current status of a session.

GET [sessions/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get)

Returns the current status of the session along with aggregated data on the number of submitted, successfully and unsuccessfully processed invoices; after the session is closed, it additionally provides a list of references to the consolidated UPO.

Example in C#:
[KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)
```csharp
SessionStatusResponse openSessionResult = await kSeFClient.GetSessionStatusAsync(referenceNumber, accessToken, cancellationToken).ConfigureAwait(false);

int documentCount = openSessionResult.InvoiceCount;
int successfulInvoiceCount = openSessionResult.SuccessfulInvoiceCount;
int failedInvoiceCount = openSessionResult.FailedInvoiceCount;
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionStatusResponse statusResponse = ksefClient.getSessionStatus(referenceNumber, accessToken);
```


### 3. Retrieving Information About Submitted Invoices

GET [sessions/\{referenceNumber\}/invoices](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices/get)

Returns a list of metadata for all submitted invoices along with their statuses and the total number of invoices in the session.

Example in C#:
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

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
SessionInvoicesResponse sessionInvoices = ksefClient.getSessionInvoices(referenceNumber,continuationtoken, pageSize, authToken);

while (Strings.isNotBlank(sessionInvoices.getContinuationToken())) {
    sessionInvoices = ksefClient.getSessions(pageSize, sessionInvoices.getContinuationToken(), accessToken);
}
```
### 4. Retrieving Information About a Single Invoice

Allows retrieval of detailed information about a single invoice in a session, including its status and metadata.

You must provide the session reference number `referenceNumber` and the invoice reference number `invoiceReferenceNumber`.

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D/get)

Example in C#:
```csharp
SessionInvoice invoice = await ksefClient
                .GetSessionInvoiceAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken);
```

Example in Java:
[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
SessionInvoiceStatusResponse statusResponse = ksefClient.getSessionInvoiceStatus(sessionReferenceNumber, invoiceReferenceNumber, accessToken);

```

### 5. Downloading UPO for an Invoice

Allows downloading the UPO for a single, correctly accepted invoice.

#### 5.1 By Invoice Reference Number

GET [sessions/\{referenceNumber\}/invoices/\{invoiceReferenceNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1%7BinvoiceReferenceNumber%7D~1upo/get)

Example in C#:
```csharp
string upo = await ksefClient
                .GetSessionInvoiceUpoByReferenceNumberAsync(
                referenceNumber,
                invoiceReferenceNumber,
                accessToken,
                cancellationToken)
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByReferenceNumber(sessionReferenceNumber, invoiceReferenceNumber, accessToken);
```

#### 5.2 By KSeF Invoice Number

GET [sessions/\{referenceNumber\}/invoices/ksef/\{ksefNumber\}/upo](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1ksef~1%7BksefNumber%7D~1upo/get)

Example in C#:
```csharp
var upo = await ksefClient
                .GetSessionInvoiceUpoByKsefNumberAsync(
                referenceNumber,
                ksefNumber,
                accessToken,
                cancellationToken)
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] upoResponse = ksefClient.getSessionInvoiceUpoByKsefNumber(sessionReferenceNumber, ksefNumber, accessToken);
```

The received XML document is:
* signed in XADES format by the Ministry of Finance
* compliant with the [XSD](/faktury/upo/schemy/upo-v4-3.xsd) schema.

### 6. Retrieving the List of Incorrectly Processed Invoices

GET [sessions/\{referenceNumber\}/invoices/failed](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices~1failed/get)

Returns the total number of rejected invoices in the session and detailed information (status and error details) for each incorrectly processed invoice.

Example in C#:
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

Example in Java:
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

This endpoint allows selective retrieval of only rejected invoices, which facilitates error analysis in sessions containing a large number of invoices.

### 7. Downloading the Session UPO

The session UPO is a consolidated acknowledgement of receipt for all invoices correctly submitted within a given session.

After the session is closed, in response to checking its [status](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get) (step 2 – Checking Session Status), not only information about the number of correctly and incorrectly processed invoices is returned, but also a list of references to consolidated UPOs.

Each element of the `upo.pages[]` array contains the UPO reference number (`referenceNumber`) and a link (`downloadUrl`) enabling its download:

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

Having this list, the API client can download UPOs one by one by calling the endpoint indicated in the `downloadUrl` field, i.e.  
GET [/sessions/\{referenceNumber\}/upo/\{upoReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1upo~1%7BupoReferenceNumber%7D/get)

The received XML document is compliant with the [XSD](/faktury/upo/schemy/upo-v4-3.xsd) schema and may contain a maximum of 10,000 invoice entries.

Example in C#:

```csharp
 string upo = await ksefClient.GetSessionUpoAsync(
            sessionReferenceNumber,
            upoReferenceNumber,
            accessToken,
            cancellationToken
        );
```

Example in Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] sessionUpo = ksefClient.getSessionUpo(sessionReferenceNumber, upoReferenceNumber, accessToken);
```

## Related Documents
- [KSeF Number – Structure and Validation](../numer-ksef.md)
