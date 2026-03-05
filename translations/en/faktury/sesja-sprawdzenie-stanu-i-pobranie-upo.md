---
original: faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md)

## Session – checking status and downloading UPO
10.07.2025

This document describes operations for monitoring the status of sessions (interactive or batch) and downloading UPO for invoices and the entire session.

### 1. Getting list of sessions
Returns a list of sessions that meet the specified search criteria.

GET [sessions](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions/get)

Returns the current session status along with aggregated data about the number of sent, correctly and incorrectly processed invoices; after closing the session, it additionally provides a list of references to the collective UPO.

Example in C#:
[KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Sessions/SessionStatusE2ETests.cs)
```csharp
// Getting batch sessions
 List<Session> sessions = new List<Session>();
 const int pageSize = 20;
 string? continuationToken = null;
 do
 {
     SessionsListResponse response = await ksefClient.GetSessionsAsync(SessionType.Batch, accessToken, pageSize, continuationToken, sessionsFilter, cancellationToken).ConfigureAwait(false);
     continuationToken = response.ContinuationToken;
     sessions.AddRange(response.Sessions);
 } while (!string.IsNullOrEmpty(continuationToken));

// Getting interactive sessions
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

### 2. Checking session status
Checks the current session status.

GET [sessions/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get)

Returns the current session status along with aggregated data about the number of sent, correctly and incorrectly processed invoices; after closing the session, it additionally provides a list of references to the collective UPO.

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


### 3. Getting information about sent invoices

GET [sessions/\{referenceNumber\}/invoices](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1invoices/get)

Returns a list of metadata for all sent invoices along with their statuses and the total number of these invoices in the session.

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
### 4. Getting information about a single invoice

Enables downloading detailed information about a single invoice in a session, including its status and metadata.

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

### 5. Downloading UPO for an invoice

Enables downloading UPO for a single, correctly accepted invoice.

#### 5.1 Based on invoice reference number

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

#### 5.2 Based on KSeF invoice number

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
* compliant with the [XSD schema](/faktury/upo/schemy/upo-v4-3.xsd).

### 6. Getting list of incorrectly accepted invoices

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

The endpoint enables selective downloading of only rejected invoices, which facilitates error analysis in sessions containing a large number of invoices.

### 7. Downloading session UPO

Session UPO is a collective acknowledgment of receipt for all invoices correctly sent within a given session.

After closing the session, in response to checking its [status](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D/get) (step 2 – Checking session status), not only information about the number of correctly and incorrectly processed invoices is returned, but also a list of references to collective UPOs.

Each element of the `upo.pages[]` array contains a UPO reference number (`referenceNumber`) and a link (`downloadUrl`) enabling its download:

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

Having this list, the API client can download UPOs individually by calling the endpoint indicated in the `downloadUrl` field, i.e.  
GET [/sessions/\{referenceNumber\}/upo/\{upoReferenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Status-wysylki-i-UPO/paths/~1sessions~1%7BreferenceNumber%7D~1upo~1%7BupoReferenceNumber%7D/get)

The received XML document is compliant with the [XSD schema](/faktury/upo/schemy/upo-v4-3.xsd) and can contain a maximum of 10,000 invoice entries.

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

## Related documents
- [KSeF number – structure and validation](numer-ksef.md)
