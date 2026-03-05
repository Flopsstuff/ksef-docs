---
original: limity/limity-api.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [limity/limity-api.md](https://github.com/CIRFMF/ksef-docs/blob/main/limity/limity-api.md)

## API Request Limits
22.11.2025

Due to the scale of KSeF operations and its public nature, mechanisms have been introduced to limit the intensity of API requests. Their purpose is to protect system stability, protect against cyber threats, and ensure equal access conditions for all users. The limits define the maximum number of queries that can be executed within a specified time and enforce an integration approach that aligns with the system's architectural assumptions.

### General Principles of Limits

#### 1. How Limits Are Calculated
All requests to the KSeF API are subject to limits. These restrictions apply to every call to a protected endpoint. For traffic billing purposes, requests are grouped by pair: context and IP address.

- **context** - defined by the `ContextIdentifier` (`Nip`, `InternalId`, or `NipVatUe`) passed during authentication.
- **IP address** - the IP address from which the network connection is established.

Request limits are calculated independently for each pair: context and IP address. This means that traffic in the same context but from different IP addresses is billed separately.

Example  
Accounting firm A downloads invoices on behalf of company B, using company B's context (NIP) and connecting to KSeF from IP address IP1.
Simultaneously, company B downloads invoices independently, in the same context (its own NIP), but from a different IP address - IP2. Despite the shared context, different IP addresses cause limits to be calculated independently.
In such a situation, the system treats each connection as a separate pair (context + IP address) and calculates limits independently: separately for accounting firm A and separately for company B.

**Limit Units**  
The following notations are used in limit tables:
- req/s - number of requests per second,
- req/min - number of requests per minute,
- req/h - number of requests per hour.

**Limit Calculation Model (sliding/rolling window)**  
Limits are enforced using a sliding time window model. At any given moment, requests executed in the following periods are counted:

- for req/h threshold - in the last 60 minutes,
- for req/min threshold - in the last 60 seconds,
- for req/s threshold - in the last second.

Windows are not aligned to full hours or minutes (they do not "reset" at :00). All thresholds (req/s, req/min, req/h) apply concurrently - blocking is triggered upon the first violation of any of them.

#### 2. System Blocks API Access After Limit Exceeded
When API request limits are exceeded, HTTP code **429 Too Many Requests** is returned, and subsequent requests are temporarily blocked.  
The blocking period is **dynamic** and depends on the frequency and scale of violations. The exact blocking time is returned in the `Retry-After` response header (in seconds). Multiple violations can result in significantly extended blocking periods.

Example 429 response:
```json
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 30

{
  "status": {
    "code": 429,
    "description": "Too Many Requests",
    "details": [ "Exceeded limit of 20 requests per minute. Try again after 30 seconds." ]
  }
}

```

#### 3. Recording Violations
All cases of request limit violations are logged and analyzed by security mechanisms. This data is used to monitor API stability and detect potential abuse. 
The system pays particular attention to patterns indicating attempts to circumvent limits, e.g., through parallel and systematic use of multiple IP addresses within one context. Such actions may be considered a security threat.

In case of repeated violations or extreme load, the system may automatically apply protective measures, such as:
- blocking access to the KSeF API for a given entity or IP address range,
- limiting availability for the most burdensome contexts.

#### 4. Higher Limits During Night Hours
Between 20:00-06:00, higher download limits apply than during the day. 
Detailed values will be determined in the initial period of KSeF 2.0 operation, after adjusting parameters to actual loads.

#### 5. Preliminary Limit Assumptions
API request limits have been determined based on anticipated system usage scenarios and load models. 

The actual nature of traffic will depend on how integrations are implemented in external systems and the load patterns they generate. This means that limits established at the design stage may differ from values maintained in the production environment.

For this reason, limits are dynamic in nature and may be adjusted depending on operational conditions and integrator behavior. In particular, their temporary reduction is permitted in case of intensive or inefficient API usage.


### Limits in Environments

**TE (Test) Environment**
In the TE environment, limits have been configured to allow integrators to work freely and test integrations without risk of blocking. Default limit values are **ten times higher** than in production, allowing for intensive testing.
Additionally, thanks to available endpoints, various scenarios can be simulated:

* [POST /testdata/rate-limits/production](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1rate-limits~1production/post) - activates limits as in production (PRD),
* [POST /testdata/rate-limits](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1rate-limits/post) - allows setting custom values,
* [DELETE /testdata/rate-limits](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1rate-limits/delete) - restores default TE environment limits.

**DEMO (Pre-production) Environment**
In the DEMO environment, **the same limits as in production** apply for a given context. These values are **replicated from PRD** and serve for final validation of performance and integration stability before production deployment.

**PRD (Production) Environment**
In the PRD environment, **default limits** specified in this documentation are applied.
In justified cases - e.g., large-scale invoice processing - there is a possibility to **submit a request for limit increase** via a dedicated form (in preparation).  

## Invoice Download - Limits

### Architectural Assumptions
The KSeF API in the area of invoice downloading has been designed as a **document synchronization** mechanism between the central repository and the local database of external systems. The key assumption is that business operations, such as searching, filtering, or reporting, should be performed on locally stored data that has been previously synchronized with KSeF. This approach increases operational stability, minimizes the risk of system overload, and allows for more flexible data utilization by client applications.

The KSeF API in the scope of invoice downloading is not intended to handle direct real-time end-user operations. This means it should not be used for:
- downloading individual invoices on user demand, e.g., invoice preview,
- downloading invoice metadata lists or initiating package exports in response to current application actions, except when the user consciously initiates data synchronization.

### Recommended Integration Approach for Downloads
The `/invoices/query/metadata` endpoint is used for incremental synchronization. Detailed rules for incremental synchronization are described in a separate document.

Depending on invoice volume, different approaches to downloading them can be used:
1. **Low volume scenarios** - if the number of invoices is limited and can be handled within available limits in the expected time, they can be downloaded synchronously by calling `/invoices/ksef/{ksefNumber}` for selected documents.
2. **High volume scenarios** - if the number of documents is significant and handling in synchronous mode becomes impractical, it is recommended to use the export mechanism (`/invoices/exports`). Export works asynchronously, is queued, and therefore does not negatively impact system performance.
3. **Business operations** - regardless of the chosen strategy, all user activities (searching, filtering, reporting) should be performed on the **local database**, previously synchronized with KSeF.

### Invoice Synchronization and Download Modes  
Invoice download to an accounting system can be implemented in three modes:
1. **On user demand** - incremental synchronization is triggered **manually** by the user, from the last confirmed checkpoint.
2. **Cyclically** - incremental synchronization is performed automatically according to the system schedule.
3. **Mixed mode** - incremental synchronization runs cyclically, and additionally the user can trigger it manually on demand.

### Polling Frequency
- **High-frequency schedules are not recommended**. In the production environment, the cyclic interval should not be shorter than 15 minutes for each entity appearing on the invoice (Entity 1, Entity 2, Entity 3, Authorized entity).
- **Low volume profiles.** On-demand downloading is recommended, supplemented by a cycle e.g., once a day in the night window.
- **Invoice receipt date.** The invoice receipt date is the date when the KSeF number is assigned. This number is automatically assigned by the system at the moment the invoice is processed and does not depend on when it is downloaded to the accounting system.

### Examples of Non-recommended Implementation
Improper integration can lead to API blocking. The most common errors include:
1. Synchronization exclusively through downloading individual invoices (synchronous path), without using invoice package export.
Such an approach is permissible only in low volume profiles; with a larger number of documents, the `/invoices/exports` mechanism should be used.
2. Handling end-user requests (e.g., displaying full invoice content in the application, downloading XML file) through direct KSeF API calls instead of using the local database.

### Detailed Limits

| Endpoint | | req/s | req/min | req/h |
|----------|---|-------|---------|-------|
| Get invoice metadata list | POST /invoices/query/metadata | 8 | 16 | 20 |
| Export invoice package | POST /invoices/exports | 4 | 8 | 20 |
| Get export package status | /invoices/exports/{referenceNumber} | 10 | 60 | 600 |
| Get invoice by KSeF number | GET /invoices/ksef/{ksefNumber} | 8 | 16 | 64 |

**Note:** If the available invoice download limits are insufficient for your organization's business scenarios, please contact KSeF support for individual analysis and selection of an appropriate solution.

## Invoice Sending - Limits

### Architectural Assumptions
- Invoice sending, regardless of the type of sending, is queued.
- Processing is optimized for the fastest possible confirmation of invoice correctness and return of the KSeF number.

#### Batch Sending (invoice packages):

- An invoice package is treated as one message in the queue (package reference instead of separate entries for each invoice) and processed with the same priority as a single document.
- Package sending reduces network and operational overhead because:
	- fewer HTTP requests are executed,
	- content operations (decryption, validation, storage) are performed in batches, which is the most efficient way to handle multiple documents simultaneously.
- Batch compression. Due to the XML format and high repeatability of elements between invoices (fixed structure, similar field names, repeatable blocks), the achieved compression ratio is usually very favorable, which significantly reduces data volume and shortens transmission time. In practice, it is faster to send one package containing e.g., 100 invoices than 100 individual invoices in an interactive session.
- Limits. The limit mechanism works independently of the sending mode. Batch sending naturally reduces the number of requests and facilitates efficient use of available limits.
- Application. Batch mode is recommended wherever more than one document is transmitted in one operational window. It is particularly effective for cyclical customer settlements, in e-commerce, and in automated invoicing processes.

Example scenarios for batch mode application:
- **Online store (e-commerce).** Orders and payments are processed asynchronously, and invoices are issued automatically by the ERP system or invoicing module. A single invoice does not need to be sent to KSeF immediately after issuance. A dedicated process can aggregate issued invoices and cyclically - e.g., every 5 minutes - send them in batch packages to KSeF, which significantly reduces the number of HTTP requests and optimizes limit utilization.
- **Subscription services / cyclical settlements.** Invoices are generated collectively once a day or once a month (e.g., in telecommunications or media) and sent in one package within a planned batch session.
- **Automated invoicing processes in enterprises.** These occur e.g., in the distribution, logistics, production, or B2B service sectors. Invoices are generated automatically based on system events (deliveries, order fulfillments) and sent collectively, e.g., after operation completion.

**Recommendation:** to ensure maximum integration efficiency, it is recommended to aggregate documents in one batch session wherever possible from a business process perspective. This allows reducing the number of API requests and optimizes the use of available limits.

**Detailed Limits**

| Endpoint | | req/s | req/min | req/h |
|----------|---|-------|---------|-------|
| Open batch session * | POST /sessions/batch | 10 | 20 | 60 |
| Close batch session | POST /sessions/batch/{referenceNumber}/close | 10 | 20 | 60 |

**Package part sending** - requests transmitting package parts within one batch session are not subject to API limits. For packages divided into multiple parts, parallel (multi-threaded) sending is recommended, which significantly shortens the sending time.

#### Interactive Sending (individual)
Interactive mode has been designed for scenarios requiring quick registration of individual invoices and immediate obtaining of the KSeF number. Unlike batch sessions, each invoice is sent independently within an active interactive session. Its purpose is to minimize the time needed to obtain the KSeF number for a single document. Application includes low volume scenarios where individual invoices are sent.

Example scenarios for interactive mode application:
- **Retail point of sale (POS)**. After completing a transaction, an invoice is issued, and the system immediately registers it in KSeF and returns the KSeF number for printing or presentation to the customer.
- **Mobile applications and lightweight sales systems** that do not have queuing or buffering mechanisms, sending invoices immediately after issuance.
- **One-time or irregular events** e.g., a single corrective invoice.

Interactive mode, despite greater network overhead in case of larger volumes, is a necessary complement to batch mode in scenarios requiring current response or immediate document registration in KSeF. It should be used exclusively where immediate invoice processing is crucial for the business process or when the scale of operations does not justify using batch sessions.

**Detailed Limits**

| Endpoint | | req/s | req/min | req/h |
|----------|---|-------|---------|-------|
| Open interactive session | POST /sessions/online | 10 | 30 | 120 |
| Send invoice * | POST /sessions/online/{referenceNumber}/invoices | 10 | 30 | 180 |
| Close interactive session | POST /sessions/online/{referenceNumber}/close | 10 | 30 | 120 |

\* **Note:** If your organization's business scenarios regularly reach interactive session sending limits, batch mode should be considered first, which allows more efficient use of available resources and limits.
In situations where using interactive sessions is necessary but the achieved limits remain insufficient, please contact KSeF support for individual analysis and help in selecting a solution.

### Session and Invoice Status

**Detailed Limits**

| Endpoint | | req/s | req/min | req/h |
|----------|---|-------|---------|-------|
| Get invoice status from session | GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber} | 30 | 120 | 1200 |
| Get session list | GET /sessions | 5 | 10 | 60 |
| Get session invoices | GET /sessions/{referenceNumber}/invoices | 10 | 20 | 200 |
| Get incorrectly processed session invoices | GET /sessions/{referenceNumber}/invoices/failed | 10 | 20 | 200 |
| Others | GET /sessions/* | 10 | 120 | 1200 |

## Others

Default limits apply to all API resources that do not have specific values defined in this documentation. Each such endpoint has its own limit counter, and its requests do not affect other resources.

These limits apply only to protected resources. They do not include public API resources, such as `/auth/challenge`, which do not require authentication and have their own protection mechanisms - the limit is 60 requests per second for one IP address.

| Endpoint | | req/s | req/min | req/h |
|----------|---|-------|---------|-------|
| Others | POST/GET /* | 10 | 30 | 120 |

Related documents:
- [Limits](limity.md)
