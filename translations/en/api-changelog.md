---
original: api-changelog.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 935d16c
last_translated: 2026-03-07
---

> **Translation.** Original: [api-changelog.md](https://github.com/CIRFMF/ksef-docs/blob/main/api-changelog.md)

## Changes in API 2.0

### Version 2.2.1

- **Invoice sending**  
  Added new version (`1-1E`) of `FA_RR (1)` schema.  
  Schema `FA_RR (1) 1-0E` will be supported on TEST environment until 23.04.
  Schema `FA_RR (1) 1-1E` will be mandatory on PRD environment from 01.04.  

### Version 2.2.0

- **Permissions**  
  Added new endpoint (POST `/permissions/query/entities/grants`) enabling retrieval of invoice handling permissions list in the current context (returned permissions: `InvoiceWrite`, `InvoiceRead` - granted by another entity).

- **Authentication**  
  Extended POST `/auth/challenge` response with `clientIp` property, returning client IP address registered by KSeF. Value can be directly used to build `AuthorizationPolicy` in subsequent authentication steps.

- **OpenAPI**  
  - Extended `401 Unauthorized` and `403 Forbidden` responses with standardized "Problem Details" error format (`application/problem+json`). Added `UnauthorizedProblemDetails` and `ForbiddenProblemDetails` schemas. `ForbiddenProblemDetails` provides properties including `reasonCode` and optional `security` object for additional information.
  - Restored (applies only to OpenAPI specification) `additionalProperties` for dictionary fields: `InvoiceStatusInfo.extensions` and `PartUploadRequest.headers`.
  - Minor description updates.

- **Invoice package export (POST `/invoices/exports`).**  
  Fixed generation of `_metadata.json` file in export package - with large number of invoices, the file could previously be truncated (invalid JSON).

### Version 2.1.2

- **Invoice sending**  
  Added support for RR invoices ([RR(1)_v1-0E schema](/faktury/schemy/RR/schemat_RR(1)_v1-0E.xsd)).

- **Generate new token (POST `/tokens`)**  
  In request model (`GenerateTokenRequest`) extended `permissions` property (enum `TokenPermissionType`) with `Introspection` value, allowing granting of this permission during token generation.

- **Invoice package export (POST `/invoices/exports`). Retrieve invoice metadata list (POST `/invoices/query/metadata`)**   
  Fixed interpretation of `dateRange.from` / `dateRange.to` parameters provided without offset. Values without timezone are now unambiguously interpreted according to documentation (local time Europe/Warsaw).

- **OpenAPI**  
  Removed `additionalProperties`: `false` in selected models. Change organizing specification and making contract more flexible - allows possibility of additional properties appearing in requests or responses (e.g. as extensions). Adding new property is not treated as contract breaking; API clients should ignore unknown properties.

### Version 2.1.1

- **Authentication**  
  - **Retrieve authentication status (GET `/auth/{referenceNumber}`)** and **Retrieve list of active sessions (GET `/auth/sessions`)**  
  Completed `authenticationMethodInfo` definition - marked `category`, `code` and `displayName` properties as `required` in response model.
  - **Authentication using XAdES signature (POST `/auth/xades-signature`)**  
  Added possibility to enable new XAdES validation requirements earlier on DEMO and PRD environments via header: `X-KSeF-Feature`: `enforce-xades-compliance`.  

### Version 2.1.0

- **Authentication**  
  - Added integration with National Node (login.gov.pl). Endpoint used for this integration is not publicly available (authentication method intended exclusively for government applications).
  - **Retrieve authentication status (GET `/auth/{referenceNumber}`)** and **Retrieve list of active sessions (GET `/auth/sessions`)**  
    - Marked `authenticationMethod` property as `deprecated` in response model. Planned removal: `2026-11-16`. To maintain contract compatibility during transition period, `TrustedProfile` value covers both "Trusted Profile" and authentications performed by National Node.
    - Added new `authenticationMethodInfo` property as flexible description of authentication method: 
      - `category` - authentication method category (enum: `XadesSignature`, `NationalNode`, `Token`, `Other`), 
      - `code` - authentication method code (string), 
      - `displayName` - authentication method name for user display (string).
    - Extended possible values of details field for status `460` ("Authentication failed due to certificate error") with: "Certificate suspended".

  - **Authentication using XAdES signature (POST `/auth/xades-signature`)**  
    Unified and tightened [XAdES signature](/auth/podpis-xades.md) validation in authentication process, so that only signatures compliant with XAdES profile requirements are accepted.  
    New requirements are already in effect on TEST environment. On DEMO and PRD environments they will take effect **March 16, 2026** (we recommend verifying integration on TEST before this date).

- **Test data**  
  Added new endpoints:
    - POST `/testdata/context/block` - "Blocks authentication possibility for specified context. Authentication will end with error 480.",
    - POST `/testdata/context/unblock` - unblocks authentication possibility for current context.  

- **OpenAPI**  
  Minor description updates.

### Version 2.0.1

- **Permissions**
  - Retrieve list of own permissions (POST `/permissions/query/personal/grants`).  
    - Fixed logic for returning "My permissions" list for context owner - results now also include entity permissions for invoice issuing and viewing (`InvoiceWrite`, `InvoiceRead`) granted **without** delegation rights `canDelegate = false`. Previously, the list only returned those with delegation rights.
    - Added description for `InternalId` value in `PersonalPermissionsContextIdentifierType`; 
    - Updated length constraints for `PersonalPermissionsContextIdentifier.value` (`maxLength` from 10 to 16).
  - Fixed examples in OpenAPI documentation for permissions endpoints.

- **Invoice retrieval**  
  Clarified `dateRange` validation in `InvoiceQueryFilters`: 3-month range is considered valid if it fits within three months in UTC or Polish time.

- **Invoice sending**
  - NIP number validation  
    Added NIP checksum verification for: `Podmiot1`, `Podmiot2`, `Podmiot3` and `PodmiotUpowazniony` (if present) - applies only to production environment.
  - NIP validation in internal identifier  
    Added NIP checksum verification in `InternalId` for `Podmiot3` (if identifier is present) - applies only to production environment.
  - Updated [documentation](/faktury/weryfikacja-faktury.md).

- **OpenAPI**  
  Minor description updates.

### Version 2.0.0

- **UPO**  
  As announced in RC6.0, from `2025-12-22` UPO version v4-3 is returned by default.

- **Session status** (GET `/sessions/{referenceNumber}`)  
  - Extended response model with `dateCreated` ("Session creation date") and `dateUpdated` ("Last activity date within session") properties.  

- **Close batch session (POST `/sessions/batch/{referenceNumber}/close`)**   
  - Added error code `21208` ("Timeout waiting for upload or finish requests exceeded").

- **Retrieve invoice/UPO**
  - Added `x-ms-meta-hash` header (`SHA-256` hash, `Base64`) in `200` responses for endpoints:
    - GET `/invoices/ksef/{ksefNumber}`,
    - GET `/sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`,
    - GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`,
    - GET `/sessions/{referenceNumber}/upo/{upoReferenceNumber}`.

- **Retrieve authentication status** (GET `/auth/{referenceNumber}`)
  - Completed HTTP 400 (Bad Request) documentation with error code `21304` ("No authentication") - authentication operation with reference number {`referenceNumber`} was not found.
  - Extended status `450` ("Authentication failed due to invalid token") with additional reason: "Invalid authorization challenge".

- **Retrieve access tokens** (POST `/auth/token/redeem`)  
  Completed HTTP 400 (Bad Request) documentation with error codes:
    - `21301` - "No authorization":
      - Tokens for operation {`referenceNumber`} have already been retrieved,
      - Authentication status ({`operation.Status`}) does not allow token retrieval,
      - KSeF token has been revoked.
    - `21304` - "No authentication" - Authentication operation {`referenceNumber`} not found, 
    - `21308` - "Attempt to use authorization methods of deceased person".

- **Refresh access token** (POST `/auth/token/refresh`)  
  Completed HTTP 400 (Bad Request) documentation with error codes:
    - `21301` - "No authorization":
      - Authentication status ({`operation.Status`}) does not allow token retrieval,
      - KSeF token has been revoked.
    - `21304` - "No authentication" - Authentication operation {`referenceNumber`} not found, 
    - `21308` - "Attempt to use authorization methods of deceased person".

- **Interactive sending** (POST `/sessions/online/{referenceNumber}/invoices`)  
  Completed error code documentation with:
    - `21402` "Invalid file size" - content length does not match file size, 
    - `21403` "Invalid file hash" - content hash does not match file hash.

- **Invoice package export (POST `/invoices/exports`). Retrieve invoice metadata list (POST `/invoices/query/metadata`)**  
  Reduced maximum allowed `dateRange` from 2 years to 3 months.

- **Permissions**  
  - Added `required` attribute for `subjectDetails` property ("Data of entity being granted permissions") in all permission granting endpoints (`/permissions/.../grants).
  - Added `required` attribute for `euEntityDetails` property ("EU entity data in context of which permissions are granted") in endpoint POST `/permissions/eu-entities/administration/grants` ("Grant EU entity administrator permissions").  
  - Added `PersonByFingerprintWithIdentifier` value ("Natural person using certificate not containing NIP or PESEL identifier but having NIP or PESEL") to enum `EuEntityPermissionSubjectDetailsType` in endpoint POST `/permissions/eu-entities/administration/grants` ("Grant EU entity administrator permissions").    
  - Changed `subjectEntityDetails` property type to `PermissionsSubjectEntityByIdentifierDetails` ("Authorized entity data") in response model in POST `/permissions/query/authorizations/grants` ("Retrieve list of entity permissions for invoice handling").  
  - Changed `subjectEntityDetails` property type to `PermissionsSubjectEntityByFingerprintDetails` ("Authorized entity data") in response model in POST `/permissions/query/eu-entities/grants` ("Retrieve list of EU entity administrator or representative permissions for self-invoicing").  
  - Changed `subjectPersonDetails` property type to `PermissionsSubjectPersonByFingerprintDetails` ("Authorized person data") in response model in POST `/permissions/query/eu-entities/grants` ("Retrieve list of EU entity administrator or representative permissions for self-invoicing").    
  - Introduced checksum validation for `InternalId` identifier in POST `/permissions/subunits/grants` ("Grant sub-entity administrator permissions").
  - Clarified property descriptions.

- **OpenAPI**  
  - Completed `429` response documentation with returned `Retry-After` header and `TooManyRequestsResponse` response body.
  - Clarified `byte` type property descriptions - values are passed as binary data encoded in `Base64` format.
  - Fixed typos in specification.

### Version 2.0.0 RC6.1

- **New environment addressing**  
  New addresses made available. Changes in [KSeF API 2.0 environments](srodowiska.md) section.

- **Authentication - retrieve status (GET `/auth/{referenceNumber}`)**  
  Added code `480` - Authentication blocked: "Security incident suspected. Contact Ministry of Finance through submission form."

- **Permissions**  
  - Extended access rules for session operations (GET/POST `/sessions/...`): added `EnforcementOperations` (enforcement authority) to list of accepted permissions.
  - Added length constraints for string type properties: `minLength` and `maxLength`.
  - Added `id` (`Asc`) as second sorting key in `x-sort` metadata for permission search queries. Default order: `dateCreated` (`Desc`), then `id` (`Asc`) - ordinal change increasing pagination determinism.
  - Added validation for `IdDocument.country` property in endpoint POST `/permissions/persons/grants` ("Grant natural persons permissions to work in KSeF") - requires compliance with **ISO 3166-1 alpha-2** (e.g. `PL`, `DE`, `US`).
  - "Retrieve list of EU entity administrator or representative permissions for self-invoicing" (POST `/permissions/query/eu-entities/grants`):
    - removed pattern (regex) validation and clarified description of `EuEntityPermissionsQueryRequest.authorizedFingerprintIdentifier` property.
    - clarified description of `EuEntityPermissionsQueryRequest.vatUeIdentifier` property.

- **Interactive session**  
  Added new error codes for POST `/sessions/online/{referenceNumber}/invoices` ("Send invoice"):
    - `21166` - Technical correction unavailable.
    - `21167` - Invoice status does not allow technical correction.

- **API limits**  
  - Increased hourly limit for `invoiceStatus` group (retrieve invoice status from session) from 720 to 1200 req/h: 
    - GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}.
  - Increased hourly limit for `sessionMisc` group (GET `/sessions/*` resources) from 720 to 1200 req/h:
    - GET `/sessions/{referenceNumber}`, 
    - GET `/sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`,
    - GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`,
    - GET `/sessions/{referenceNumber}/upo/{upoReferenceNumber}`.
  - Reduced hourly limit for `batchSession` group (open/close batch session) from 120 to 60 req/h: 
    - POST `/sessions/batch`, 
    - POST `/sessions/batch/{referenceNumber}/close`.
  - Increased limits for endpoint `/invoices/exports/{referenceNumber}` ("Retrieve invoice package export status") by adding new `invoiceExportStatus` group with parameters: 10 req/s, 60 req/min, 600 req/h. 

- **Open batch session (POST `/sessions/batch`)**  
  Removed `fileName` property from `BatchFilePartInfo` model (previously marked as deprecated; x-removal-date: 2025-12-07).  

- **Initialize authentication (POST `/auth/challenge`)**  
  Added `timestampMs` property (int64) in response model - challenge generation time in milliseconds since 1.01.1970 (Unix).

- **Test data**
  - Clarified `expectedEndDate` property type: format: `date` in (POST `/testdata/attachment/revoke`).
  - Removed `Token` value from enum `SubjectIdentifierType` in endpoint POST `/testdata/limits/subject/certificate`. Value was unused: in KSeF entity cannot be a "token" - identity always derives from `NIP/PESEL` or certificate fingerprint, which carries identity of entity that created it.

- **OpenAPI**  
  Increased maximum `pageSize` value from 500 to 1000 for endpoints:
  - GET `/sessions`
  - GET `/sessions/{referenceNumber}/invoices`
  - GET `/sessions/{referenceNumber}/invoices/failed`

### Version 2.0.0 RC6.0

- **API limits**  
  - On **TE** (test) environment enabled and defined [API limits](limity/limity-api.md) policy with values 10x higher than on **PRD**; details: ["Limits on environments"](/limity/limity-api.md#limity-na-środowiskach).
  - On **TR** (DEMO) environment enabled [API limits](limity/limity-api.md) with values identical to **PRD**. Values are replicated from production; details: ["Limits on environments"](/limity/limity-api.md#limity-na-środowiskach).
  - Added endpoint POST `/testdata/rate-limits/production` - sets production profile API limit values in current context. Available only on **TE** environment.
  
- **Invoice package export (POST `/invoices/exports`). Retrieve invoice metadata list (POST `/invoices/query/metadata`)**   
  - Added [High Water Mark (HWM)](pobieranie-faktur/hwm.md) document describing data completeness management mechanism over time.
  - Updated [Incremental invoice retrieval](pobieranie-faktur/przyrostowe-pobieranie-faktur.md) with recommendations for using `HWM` mechanism.
  - Extended response model with `permanentStorageHwmDate` property (string, date-time, nullable). Applies only to queries with `dateType = PermanentStorage` and indicates point below which data is complete; for `dateType = Issue/Invoicing` - null.  
  - Added `restrictToPermanentStorageHwmDate` property (boolean, nullable) in `dateRange` object, which enables High Water Mark (`HWM`) mechanism and restricts date range to current `HWM` value. Applies only to queries with `dateType = PermanentStorage`. Using this parameter significantly reduces duplicates between successive exports and ensures consistency during long-term incremental synchronization.

- **UPO - XSD update to v4-3**
  - Changed pattern for `NumerKSeFDokumentu` element to also allow KSeF numbers generated for invoices from KSeF 1.0 (36 characters).
  - Added `TrybWysylki` element - document submission mode to KSeF: `Online` or `Offline`.
  - Changed `NazwaStrukturyLogicznej` value to format: Schemat_{systemCode}_v{schemaVersion}.xsd (e.g. Schemat_FA(3)_v1-0E.xsd).
  - Changed `NazwaPodmiotuPrzyjmujacego` value on test environments by adding suffix with environment name:
    - `TE`: Ministerstwo Finansów - środowisko testowe (TE),
    - `TR`: Ministerstwo Finansów - środowisko przedprodukcyjne (TR).
    
    `PRD`: no change - Ministerstwo Finansów.  
  - Currently UPO v4-2 is returned by default. To receive UPO v4-3, add header: `X-KSeF-Feature: upo-v4-3` when opening session (online/batch).
  - From `2025-12-22` UPO v4-3 will be the default version.
  - UPO v4-3 XSD: [schema](/faktury/upo/schemy/upo-v4-3.xsd).

- **Session status** (GET `/sessions/{referenceNumber}`)  
    Clarified description of code `440` - Session cancelled: possible reasons are "Sending timeout exceeded" or "No invoices sent".    

- **Invoice status** (GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}`)  
    Added `InvoiceStatusInfo` type (extends `StatusInfo`) with `extensions` field - object with structured status details. `details` field remains unchanged. Example (duplicate invoice):
    
    ```json
    "status": {
      "code": 440,
      "description": "Duplikat faktury",
      "details": [
        "Duplikat faktury. Faktura o numerze KSeF: 5265877635-20250626-010080DD2B5E-26 została już prawidłowo przesłana do systemu w sesji: 20250626-SO-2F14610000-242991F8C9-B4"
      ],
      "extensions": {
        "originalSessionReferenceNumber": "20250626-SO-2F14610000-242991F8C9-B4",
        "originalKsefNumber": "5265877635-20250626-010080DD2B5E-26"
      }
    }    
    ```

- **Permissions**  
    Added `subjectDetails` property - "Data of entity being granted permissions" to all permission granting endpoints (/permissions/.../grants). In RC6.0 field is optional; from 2025-12-19 will be required.  

- **Search granted permissions** (POST `/permissions/query/authorizations/grants`)  
    Extended access rules with `PefInvoiceWrite`.

- **Test data - attachments (POST /testdata/attachment/revoke)**  
  Extended `AttachmentPermissionRevokeRequest` request model with `expectedEndDate` field (optional) - date of consent withdrawal for sending invoices with attachment.    

- **OpenAPI**  
  - Added HTTP `429` - "Too Many Requests" response to all endpoints. In `description` property of this response, tabular presentation of limits (`req/s`, `req/min`, `req/h`) and name of limit group assigned to endpoint is published. Mechanism and semantics of `429` remain consistent with description in [limits](/limity/limity-api.md) documentation.
  - Added `x-rate-limits` metadata with limit values (`req/s`, `req/min`, `req/h`) to each endpoint.
  - Removed explicit `exclusiveMaximum`: `false` and `exclusiveMinimum`: `false` properties from numeric definitions (left only minimum/maximum). Organizing change – no impact on validation (in OpenAPI default values of these properties are `false`).
  - Added length constraints for string type properties: `minLength`.
  - Removed explicit `style`: `form` settings for parameters in in: query.
  - Changed order of `BuyerIdentifierType` enum values (currently: `None`, `Other`, `Nip`, `VatUe`). Ordinal change - no impact on operation.
  - Fixed typo in `KsefNumber` property description.
  - Clarified format of `PublicKeyCertificate` property representing binary data encoded in `Base64`, set format: `byte`.
  - Introduced minor language and punctuation corrections in `description` fields.

### Version 2.0.0 RC5.7

- **Open batch session (POST `/sessions/batch`)**  
  Marked `BatchFilePartInfo.fileName` as `deprecated` in request model (planned removal: 2025-12-05).

- **Asynchronous operation statuses**  
  Added status `550` - "Operation was cancelled by system". Description: "Processing was interrupted for internal system reasons. Try again."

- **OpenAPI**  
  - Added array element count constraints: `minItems`, `maxItems`.
  - Added length constraints for string type properties: `minLength` and `maxLength`.  
  - Updated property descriptions (`invoiceMetadataAuthorizedSubject.role`, `invoiceMetadataBuyer`, `invoiceMetadataThirdSubject.role`, `buyerIdentifier`).
  - Updated regex patterns for `vatUeIdentifier`, `authorizedFingerprintIdentifier`, `internalId`, `nipVatUe`, `peppolId`.

### Version 2.0.0 RC5.6

- **Retrieve session status (GET `/sessions/{referenceNumber}`)**  
  Added `UpoPageResponse.downloadUrlExpirationDate` field in response - expiration date and time of UPO download URL; after this moment `downloadUrl` is no longer active.

- **Retrieve certificate metadata list (POST `/certificates/query`)**  
  Extended response (`CertificateListItem`) with `requestDate` property - certificate application submission date.  

- **Retrieve Peppol service providers list (GET `/peppol/query`)**  
  - Extended response model with `dateCreated` field - Peppol service provider registration date in system.
  - Marked `dateCreated`, `id`, `name` properties in response model as always returned.
  - Defined `PeppolI` schema (string, 9 characters) and applied in `PeppolProvider`.

- **OpenAPI**  
  - Added `x-sort` metadata to all endpoints returning lists. Added Sorting section to endpoint descriptions with default order (e.g. "requestDate (Desc)").
  - Added length constraints for string type properties: `minLength` and `maxLength`.
  - Clarified format of properties representing binary data encoded in `Base64`: set format: `byte` (`encryptedInvoiceContent`, `encryptedSymmetricKey`, `initializationVector`, `encryptedToken`).
  - Defined common `Sha256HashBase64` schema and applied to all properties representing `SHA-256` hash in `Base64` (including `invoiceHash`).
  - Defined common `ReferenceNumber` schema (string, length 36) and applied to all parameters and properties representing asynchronous operation reference number (in paths, queries and responses).
  - Defined common `Nip` schema (string, 10 characters, regex pattern) and applied to all properties representing NIP.
  - Defined `Pesel` schema (string, 11 characters, regex pattern) and applied to property representing PESEL.
  - Defined common `KsefNumber` schema (string, 35-36 characters, regex pattern) and applied to all properties representing KSeF number.  
  - Defined `Challenge` schema (string, 36 characters) and applied in `AuthenticationChallengeResponse`.`challenge`.
  - Defined common `PermissionId` schema (string, 36 characters) and applied everywhere: in parameters and response properties.
  - Added regular expressions for selected text fields.

### Version 2.0.0 RC5.5

- **Retrieve current API limits (GET `/api/v2/rate-limits`)**  
  Added endpoint returning effective API call limits in `perSecond`/`perMinute`/`perHour` layout for different areas (including `onlineSession`, `batchSession`, `invoiceSend`, `invoiceStatus`, `invoiceExport`, `invoiceDownload`, `other`).

- **Invoice status in session**  
  Extended response for GET `/sessions/{referenceNumber}/invoices` ("Retrieve session invoices") and GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}` ("Retrieve invoice status from session") with properties: `upoDownloadUrlExpirationDate` - "expiration date and time of URL. After this date `UpoDownloadUrl` link will no longer be active". Extended `upoDownloadUrl` description.

- **Removal of \*InMib fields (change consistent with announcement from 5.3)**  
  Removed `maxInvoiceSizeInMib` and `maxInvoiceWithAttachmentSizeInMib` properties.
  Change applies to:
    - GET `/limits/context` – responses (`onlineSession`, `batchSession`),
    - POST `/testdata/limits/context/session` – request model (`onlineSession`, `batchSession`),
    - Models: `BatchSessionContextLimitsOverride`, `BatchSessionEffectiveContextLimits`, `OnlineSessionContextLimitsOverride`, `OnlineSessionEffectiveContextLimits`.
  Only *InMB fields are used for indicating sizes (1 MB = 1,000,000 B).

- **Removal of `operationReferenceNumber` (change consistent with announcement from 5.3)**  
  Removed `operationReferenceNumber` property from response model; only obligatory name is `referenceNumber`. Change includes:
  - GET `/invoices/exports/{referenceNumber}` - "Invoice package export status",
  - POST `/permissions/operations/{referenceNumber}` - "Retrieve permissions operation status".

- **Invoice package export (POST `/invoices/exports`)**  
  - Added new error code: `21182` - "Concurrent exports limit reached. Maximum limit of {count} concurrent invoice exports reached for authenticated entity in current context. Try again later".
  - Extended response model with `packageExpirationDate` property indicating prepared package expiration date. After this date expires, package will not be available for download.
  - Added error code `210` - "Invoice export expired and is no longer available for download".

- **Invoice package export status (GET `/invoices/exports/{referenceNumber}`)**  
  Clarified descriptions of package part download links:
  - `url` - "URL address to send package part download request. Link is generated dynamically when querying export operation status. Not subject to API limits and does not require access token when downloading".
  - `expirationDate` - "Expiration date and time of package part download link. After this moment link becomes inactive".

- **Authorization**
  - Extended access rules with `SubunitManage` for POST `/permissions/query/persons/grants`: operation can be performed if entity has `CredentialsManage`, `CredentialsRead`, `SubunitManage`.
  - Grant permissions indirectly (POST `/permissions/indirect/grants`)
    Updated description of `targetIdentifier.description` property: clarified that lack of context identifier means granting general indirect permission.

- **OpenAPI**  
  Increased maximum `pageSize` value from 100 to 500 for endpoints:
  - GET `/sessions`
  - GET `/sessions/{referenceNumber}/invoices`
  - GET `/sessions/{referenceNumber}/invoices/failed`

### Version 2.0.0 RC5.4

- **Retrieve invoice metadata list (POST /invoices/query/metadata)**  
  - Added `sortOrder` parameter, enabling specification of result sorting direction.

- **Session status**  
  Removed bug preventing completion of this property in API responses regarding invoices (field was not previously returned). Value is completed asynchronously at time of persistent storage and may be temporarily null.

- **Test data (only on test environments)**
  - Change API limits for current context (POST `testdata/rate-limits`)  
  Added endpoint enabling temporary override of effective API limits for current context. Change prepares launch of limits simulator on TE environment.
  - Restore default limits (DELETE `/testdata/rate-limits`)
  Added endpoint restoring default limit values for current context.

- **OpenAPI**  
  - Clarified array parameter definitions in query; applied `style: form`. Multiple values should be passed by repeating parameter, e.g. `?statuses=InProgress&statuses=Succeeded`. Documentation change, no impact on API operation.
  - Updated property descriptions (`partUploadRequests`, `encryptedSymmetricKey`, `initializationVector`).

### Version 2.0.0 RC5.3

- **Invoice package export (POST `/invoices/exports`)**  
  Added possibility to include `_metadata.json` file in export package. File has JSON object form with `invoices` array containing `InvoiceMetadata` objects (model returned by POST `/invoices/query/metadata`).
  Enabling (preview): add `X-KSeF-Feature`: `include-metadata` to request header.
  From 2025-10-27 default endpoint behavior changes - export package will always contain `_metadata.json` file (header will not be required).

- **Invoice status**  
  - In case of processing with error, when invoice number could be read (e.g. error code `440` - duplicate invoice), response contains `invoiceNumber` property with read number.
  - Marked `invoiceHash`, `referenceNumber` properties in response model as always returned.

- **Size unit standardization (MB, SI)**  
  Unified limit notation in documentation and API: values presented in MB (SI), where 1 MB = 1,000,000 B.

- **Retrieve limits for current context (GET `/limits/context`)**  
  Added `maxInvoiceSizeInMB`, `maxInvoiceWithAttachmentSizeInMB` in response model for `onlineSession` and `batchSession` properties.
  Properties `maxInvoiceSizeInMib`, `maxInvoiceWithAttachmentSizeInMib` marked as deprecated (planned removal: 2025-10-27).

- **Change session limits for current context (POST `/testdata/limits/context/session`)**  
  Added `maxInvoiceSizeInMB`, `maxInvoiceWithAttachmentSizeInMB` in request model for `onlineSession` and `batchSession` properties.
  Properties `maxInvoiceSizeInMib`, `maxInvoiceWithAttachmentSizeInMib` marked as deprecated (planned removal: 2025-10-27).

- **Invoice package export status (GET `/invoices/exports/{referenceNumber}`)**  
  Changed path parameter name from `operationReferenceNumber` to `referenceNumber`.  
  Change does not affect HTTP contract (path and value meaning unchanged) or endpoint behavior.

- **Permissions**  
  - Updated descriptions and examples of endpoints from permissions/* area. Change applies only to documentation (clarification of descriptions, formats and examples); no changes in API behavior or contract.
  - Changed path parameter name from `operationReferenceNumber` to `referenceNumber` in "Retrieve operation status" (POST `/permissions/operations/{referenceNumber}`).  
  Change does not affect HTTP contract (path and value meaning unchanged) or endpoint behavior.
  - "Grant permissions indirectly" (POST `permissions/indirect/grants`)  
    Added internal identifier support - extended `targetIdentifier` property with `InternalId` value.
  - "Retrieve list of own permissions" (POST `/permissions/query/personal/grants`)  
      - Extended `targetIdentifier` property in request model with `InternalId` value (possibility to specify internal identifier).
      - Removed `PersonalPermissionScope.Owner` value in response model. Owner permissions (granted by ZAW-FA or NIP/PESEL binding) are not returned.

- **Authentication status (GET `/auth/{referenceNumber}`)**  
  Extended error code table with `470` - "Authentication failed" with clarification: "Attempt to use authorization methods of deceased person".

- **PEF invoice handling**  
  Changed enum values (`FormCode`):
    - `FA_PEF (3)` to `PEF (3)`,
    - `FA_KOR_PEF (3)` to `PEF_KOR (3)`.

- **Generate new token (POST `/tokens`)**  
  - In request model (`GenerateTokenRequest`) marked `description` and `permissions` fields as required.
  - In response model (`GenerateTokenResponse`) marked `referenceNumber` and `token` fields as always returned.

- **KSeF token status (GET /tokens/{referenceNumber})**
  - Marked `authorIdentifier`, `contextIdentifier`, `dateCreated`, `description`, `referenceNumber`, `requestedPermissions`, `status` properties in response model as always returned.

- **Retrieve list of generated tokens (GET /tokens)**
  - Marked `authorIdentifier`, `contextIdentifier`, `dateCreated`, `description`, `referenceNumber`, `requestedPermissions`, `status` properties in response model as always returned.

- **Test data - create natural person (POST `/testdata/person`)**  
  Extended request with `isDeceased` property (boolean) enabling creation of test deceased person (e.g. for scenarios verifying status code `470`).

- **OpenAPI**
  - Clarified constraints for integer type properties in requests by adding `minimum` / `exclusiveMinimum`, `maximum` / `exclusiveMaximum` attributes.  
  - Extended response with `referenceNumber` field (contains same value as existing `operationReferenceNumber`). Marked `operationReferenceNumber` as `deprecated` and will be removed from response 2025-10-27; should transition to `referenceNumber`. Change nature: transitional rename with compatibility preservation (both properties returned in parallel until removal date).  
  Applies to endpoints:
    - POST `/permissions/persons/grants`,
    - POST `/permissions/entities/grants`,
    - POST `/permissions/authorizations/grants`,
    - POST `/permissions/indirect/grants`,
    - POST `/permissions/subunits/grants`,
    - POST `/permissions/eu-entities/administration/grants`,
    - POST `/permissions/eu-entities/grants`,
    - DELETE `/permissions/common/grants/{permissionId}`,
    - DELETE `/permissions/authorizations/grants/{permissionId}`,
    - POST `/invoices/exports`.
  - Removed `required` attribute from `pageSize` property in GET `/sessions` request ("Retrieve session list").
  - Updated examples in endpoint definitions.

### Version 2.0.0 RC5.2
- **Permissions** 
  - "Grant sub-entity administrator permissions" (POST `/permissions/subunits/grants`)  
  Added `subunitName` property ("Sub-entity name") in request. Field is required when sub-entity is identified by internal identifier.
  - "Retrieve list of sub-entity and entity administrator permissions" (POST `/permissions/query/subunits/grants`)  
  Added `subunitName` property ("Sub-entity name") in response.
  - "Retrieve list of permissions for KSeF work granted to natural persons or entities" (POST `permissions/query/persons/grants`)  
    Removed `Owner` type permission from results. `Owner` permission is assigned systemically to natural person and is not subject to granting, so should not appear in granted permissions list.
  - "Retrieve list of own permissions" (POST `/permissions/query/personal/grants`)  
    Extended filter enum `PersonalPermissionType` with `VatUeManage` value.

- **Limits**  
  - Added endpoints for checking set limits (context, authenticated entity):
    - GET `/limits/context`
    - GET `/limits/subject`
  - Added endpoints for managing limits (context, authenticated entity) in test environment:
    - POST/DELETE `/testdata/limits/context/session`
    - POST/DELETE `/testdata/limits/subject/certificate`
  - Updated [Limits](limity/limity.md).

- **Invoice status**  
  Added `invoicingMode` property in response model. Updated documentation: [Automatic offline mode determination](offline/automatyczne-okreslanie-trybu-offline.md).

- **OpenAPI**
  - Clarified constraints for integer type properties in requests by adding `minimum` / `exclusiveMinimum`, `maximum` / `exclusiveMaximum` attributes and default values `default`.
  - Updated examples in endpoint definitions.
  - Clarified endpoint descriptions.
  - Added `required` attribute for required properties in requests and responses.

### Version 2.0.0 RC5.1

- **Retrieve certificate metadata list (POST /certificates/query)**  
  Changed entity identifier representation from pair of properties `subjectIdentifier` + `subjectIdentifierType` to complex object `subjectIdentifier` { `type`, `value` }.

- **Retrieve invoice metadata list (POST /invoices/query/metadata)**
  - Changed representation of selected identifiers from property pairs type + value to complex objects { type, value }: 
    - `invoiceMetadataBuyer.identifier` + `invoiceMetadataBuyer.identifierType` to complex object `invoiceMetadataBuyerIdentifier` { `type`, `value` },
    - `invoiceMetadataThirdSubject.identifier` + `invoiceMetadataThirdSubject.identifierType` to complex object `InvoiceMetadataThirdSubjectIdentifier` { `type`, `value` }.
  - Removed `obsoleted` `Identitifer` properties from `InvoiceMetadataSeller` and `InvoiceMetadataAuthorizedSubject` objects.
  - Changed `invoiceQuerySeller` property to `sellerNip` in request filter.
  - Changed `invoiceQueryBuyer` property to `invoiceQueryBuyerIdentifier` with properties { `type`, `value` } in request filter.

- **Permissions**  
  Changed representation of selected identifiers from property pairs type + value to complex objects { type, value }: 
    - "Retrieve list of own permissions" (POST `/permissions/query/personal/grants`):  
      - `contextIdentifier` + `contextIdentifierType` -> `contextIdentifier` { `type`, `value` },
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `targetIdentifier` + `targetIdentifierType` -> `targetIdentifier` { type, value }.  
    - "Retrieve list of permissions for KSeF work granted to natural persons or entities" (POST `/permissions/query/persons/grants`),
      - `contextIdentifier` + `contextIdentifierType` -> `contextIdentifier` { `type`, `value` },
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `targetIdentifier` + `targetIdentifierType` -> `targetIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }.    
    - "Retrieve list of sub-entity and entity administrator permissions" (POST `/permissions/query/subunits/grants`):
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `subunitIdentifier` + `subunitIdentifierType` -> `subunitIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }.
    - "Retrieve list of entity roles" (POST `/permissions/query/entities/roles`):
      - `parentEntityIdentifier` + `parentEntityIdentifierType` -> `parentEntityIdentifier` { `type`, `value` }.
    - "Retrieve list of subordinate entities" (POST `/permissions/query/subordinate-entities/roles`):
      - `subordinateEntityIdentifier` + `subordinateEntityIdentifierType` -> `subordinateEntityIdentifier` { `type`, `value` }.
    - "Retrieve list of entity permissions for invoice handling" (POST `/permissions/query/authorizations/grants`):
      - `authorizedEntityIdentifier` + `authorizedEntityIdentifierType` -> `authorizedEntityIdentifier` { `type`, `value` },
      - `authorizingEntityIdentifier` + `authorizingEntityIdentifierType` -> `authorizingEntityIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }
    - "Retrieve list of EU entity administrator or representative permissions for self-invoicing" (POST `/permissions/query/eu-entities/grants`):
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }        

- **Grant EU entity administrator permissions (POST permissions/eu-entities/administration/grants)**  
  Changed property name in request from `subjectName` to `euEntityName`.

- **Authentication using KSeF token**  
  Removed redundant enum values `None`, `AllPartners` in `contextIdentifier.type` property of POST `/auth/ksef-token` request.

- **KSeF tokens**  
  - Clarified GET `/tokens` response model: properties `authorIdentifier.type`, `authorIdentifier.value`, `contextIdentifier.type`, `contextIdentifier.value` are always returned (required, non-nullable),
  - Removed redundant enum values `None`, `AllPartners` in `authorIdentifier.type` and `contextIdentifier.type` properties in GET `/tokens` response model ("Retrieve list of generated tokens").

- **Batch session**  
  Removed redundant error code `21401` - "Document does not comply with schema (json)".

- **Retrieve session status (GET /sessions/{referenceNumber})**  
  - Added error code `420` - "Invoice limit in session exceeded".

- **Retrieve invoice metadata (GET `/invoices/query/metadata`)**  
  - Added (always returned) `isTruncated` property (boolean) in response – "Determines whether result was truncated due to invoice limit exceeded (10,000)",
  - Marked `amount.type` property in request filter as required.

- **Invoice package export: initiation (POST `/invoices/exports`)**
  - Marked `operationReferenceNumber` property in response model as always returned,
  - Marked `amount.type` property in request filter as required.

- **Retrieve list of permissions for KSeF work granted to natural persons or entities (POST /permissions/query/persons/grants)**  
  - Added `contextIdentifier` in request filter and response model.

- **OpenAPI**  
  Removed unused `operationId` from specification. Organizing change.

### Version 2.0.0 RC5

- **PEF invoice handling and Peppol service providers**
  - Added support for `PEF` invoices sent by Peppol service provider. New capabilities do not change existing KSeF behaviors for other formats, they are API extensions.
  - Introduced new authentication context type: `PeppolId`, enabling work in Peppol service provider context.
  - Automatic provider registration: on first authentication of Peppol service provider (using dedicated certificate) automatic registration in system occurs.
  - Added GET `/peppol/query` endpoint ("Peppol service providers list") returning registered providers.
  - Updated access rules for session opening and closing, invoice sending requires `PefInvoiceWrite` permission.
  - Added new invoice schemas: `FA_PEF (3)`, `FA_KOR_PEF (3)`,
  - Extended `ContextIdentifier` with `PeppolId` in xsd `AuthTokenRequest`.

- **UPO**
  - Added `Uwierzytelnienie` element, which organizes data from UPO header and extends it with additional information; replaces existing `IdentyfikatorPodatkowyPodmiotu` and `SkrotZlozonejStruktury`.
  - `Uwierzytelnienie` contains:
    - `IdKontekstu` – authentication context identifier,
    - authentication proof (depending on method): 
      - `NumerReferencyjnyTokenaKSeF` - authenticating token identifier in KSeF system,
      - `SkrotDokumentuUwierzytelniajacego` - authenticating document hash function value in form received by system (including electronic signature).
  - In `Dokument` element added:
    - NipSprzedawcy,
    - DataWystawieniaFaktury,
    - DataNadaniaNumeruKSeF.
  - Unified UPO schema. UPO for invoice and session use common upo-v4-2.xsd schema. Replaces existing upo-faktura-v3-0.xsd and upo-sesja-v4-1.xsd.

- **API request limits**  
  Added [API request limits](limity/limity-api.md) specification.    

- **Authentication**  
  - Clarified status codes in GET `/auth/{referenceNumber}`, `/auth/sessions`: 
    - `415` (no permissions), 
    - `425` (authentication invalidated), 
    - `450` (invalid token: invalid token, invalid time, revoked, inactive), 
    - `460` (certificate error: invalid, chain verification error, untrusted chain, revoked, incorrect).  
  - Update of optional IP policy in XSD `AuthTokenRequest`:
    Replaced `IpAddressPolicy` with new `AuthorizationPolicy`/`AllowedIps` structure. Updated [Authentication](uwierzytelnianie.md) document.

- **Authorization**
  - Extended access rules with `VatUeManage`, `SubunitManage` for DELETE `/permissions/common/grants/{permissionId}`: operation can be performed if entity has `CredentialsManage`, `VatUeManage` or `SubunitManage`.
  - Extended access rules with `Introspection` for GET `/sessions/{referenceNumber}/...`: each of these endpoints can now be called having `InvoiceWrite` or `Introspection`.
  - Extended access rules with `InvoiceWrite` for GET `/sessions` ("Retrieve session list"): having `InvoiceWrite` permission, only sessions created by authenticating entity can be retrieved; having `Introspection` permission, all sessions can be retrieved.
  - Changed access rules for DELETE `/tokens/{referenceNumber}`: removed requirement for `CredentialsManage` permission.

- **Retrieve certificate enrollment data (GET `certificates/enrollments/data`)**    
  - Response structure change:
    - Removed: givenNames (string array).
    - Added: givenName (string).
    - Change nature: breaking (field name and type change from array to text).
  - Added error code `25011` — "Invalid CSR signature algorithm".
  - Clarified requirements for private key used for CSR signature in [KSeF Certificates](certyfikaty-KSeF.md).

- **KSeF tokens**  
  - Added error code for POST `/tokens` response ("Generate new token"): `26002` - "Cannot generate token for current context type". Token can be generated only in `Nip` or `InternalId` context.
  - Extended catalog of permissions assignable to token: added `SubunitManage` and `EnforcementOperations`.
  - Added query parameters for filtering results for GET `/tokens`:
    - `description` - search in token description (case insensitive), min. 3 characters,
    - `authorIdentifier` - search by author identifier (case insensitive), min. 3 characters,
    - `authorIdentifierType` - author identifier type used with authorIdentifier (Nip, Pesel, Fingerprint).
  - Added property 
    - `lastUseDate` - "Token last use date",
    - `statusDetails` - "Additional status information, returned in case of errors"  
    in responses for:
    - GET `/tokens` ("token list"),
    - GET `/tokens/{referenceNumber}` ("token status").

- **Retrieve invoice metadata (GET `/invoices/query/metadata`)**  
  - Filters:
    - pagination: increased maximum page size to 250 records,
    - removed `schemaType` property (with values `FA1`, `FA2`, `FA3`), previously marked as deprecated,
    - added `seller.nip`; marked `seller.identifier` as deprecated (will be removed in next release),
    - added `authorizedSubject.nip`; marked `authorizedSubject.identifier` as deprecated (will be removed in next release),
    - clarified description: no value in `dateRange.to` means using current date and time (UTC),
    - clarified maximum allowed `DateRange` to 2 years.
  - Sorting:
    - results are sorted ascending by date type specified in `DateRange`; for incremental retrieval recommended type `PermanentStorage`,
  - Response model:
    - removed `totalCount` property,
    - changed name from `fileHash` to `invoiceHash`,
    - added `seller.nip`; marked `seller.identifier` as deprecated (will be removed in next release),
    - added `authorizedSubject.nip`; marked `authorizedSubject.identifier` as deprecated (will be removed in next release),
    - marked `invoiceHash` as always returned,
    - marked `invoicingMode` as always returned,
    - marked `authorizedSubject.role` ("Authorized entity") as always returned,
    - marked `invoiceMetadataAuthorizedSubject.role` ("Authorized entity NIP") as always returned,
    - marked `invoiceMetadataThirdSubject.role` ("Third parties list") as always returned.
  - Removed [Mock] markings from property descriptions.

- **Invoice package export: initiation (POST `/invoices/exports`)**
  - Filters:
    - added `seller.nip`; marked `seller.identifier` as deprecated (will be removed in next release),
  - Removed [Mock] markings.
  - Changed error code: from `21180` to `21181` ("Invalid invoice export request").
  - Clarified sorting rules. Invoices in package are sorted ascending by date type specified in `DateRange` during export initialization.

  - **Invoice package export: status (GET `/invoices/exports/{operationReferenceNumber}`)**
    - Status descriptions: completed export status documentation:
      - `100` - "Invoice export in progress" 
      - `200` - "Invoice export completed successfully" 
      - `415` - "Error decrypting provided key"  
      - `500` - "Unknown error ({statusCode})"
    - Response model `package`:
      - added:
        - `invoiceCount` - "Total number of invoices in package. Maximum number of invoices in package is 10,000",
        - `size` - "Package size in bytes. Maximum package size is 1 GiB (1,073,741,824 bytes)",
        - `isTruncated` - "Determines whether export result was truncated due to invoice count or package size limit exceeded",
        - `lastIssueDate` - "Issue date of last invoice included in package.\nField appears only when package was truncated and export was filtered by `Issue` date type",
        - `lastInvoicingDate` - "Acceptance date of last invoice included in package.\nField appears only when package was truncated and export was filtered by `Invoicing` date type",
        - `lastPermanentStorageDate` - "Permanent storage date of last invoice included in package.\nField appears only when package was truncated and export was filtered by `PermanentStorage` date type".
    - Response model `package.parts`
      - removed `fileName`, `headers`,
      - added:
        - `partName` - "Package part file name",
        - `partSize` - "Package part size in bytes. Maximum part size is 50MiB (52,428,800 bytes)",
        - `partHash` - "Package part file SHA256 hash, encoded in Base64 format",
        - `encryptedPartSize` - "Encrypted package part size in bytes",
        - `encryptedPartHash` - "Encrypted package part SHA256 hash, encoded in Base64 format",
        - `expirationDate` - "Part download link expiration time",
      - marked all properties in `package` as always returned,
    - Removed [Mock] markings.

- **Permissions**
  - Extended POST `/permissions/eu-entities/administration/grants` request ("Grant EU entity administrator permissions") with "Entity name" `subjectName`.
  - Extended POST `/permissions/query/persons/grants` request with new `System` value for granting entity identifier filter `authorIdentifier` and removed requirement from `authorIdentifier.value` field.
  - Extended POST `/permissions/query/persons/grants` request with new `AllPartners` value for target entity identifier filter `targetIdentifier` and removed requirement from `targetIdentifier.value` field.
  - Added POST `/permissions/query/personal/grants` request to retrieve list of own permissions.
  - Added new `AllPartners` value for "target entity identifier" to POST `/permissions/indirect/grants` request ("Grant permissions indirectly"), meaning general permissions

- **Retrieve invoice (GET `/invoices/ksef/{ksefNumber}`)**  
   Added error code for 400 response: `21165` - "Invoice with specified KSeF number is not yet available".

- **Invoice attachments**  
  Added GET `/permissions/attachments/status` endpoint to check consent status for issuing invoices with attachment.

- **Retrieve session list**  
  Extended permissions for GET `/sessions`: added `InvoiceWrite`. Having `InvoiceWrite` permission, only sessions created by authenticating entity can be retrieved; having `Introspection` permission, all sessions can be retrieved.

- **Interactive session**  
  - Updated error codes for POST `/sessions/online/{referenceNumber}/invoices` ("Send invoice"):
    - removed `21154` - "Interactive session completed", 
    - added `21180` - "Session status does not allow operation".
  - Added error `21180` - "Session status does not allow operation" for POST `/sessions/online/{referenceNumber}/close` ("Close interactive session").

- **Batch session**  
  - Added error `21180` - "Session status does not allow operation" for POST `/sessions/batch/{referenceNumber}/close` ("Close batch session").

- **Invoice status in session**  
  Extended response for GET `/sessions/{referenceNumber}/invoices` ("Retrieve session invoices") and GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}` ("Retrieve invoice status from session") with properties:
  - `permanentStorageDate` – invoice permanent storage date in KSeF repository (from this moment invoice is available for download),
  - `upoDownloadUrl` – UPO download address.

- **OpenAPI**
  - Added universal input data validation error code `21405` to all endpoints. Error content from validator returned in response.
  - Added 400 response with validation returning error code `30001` ("Entity or permission already exists.") for POST `/testdata/subject` and POST `/testdata/person`.
  - Updated examples in endpoint definitions.

- **Documentation**
  - Clarified signature algorithms and examples in [QR Codes](kody-qr.md).
  - Updated C# and Java code examples.

### Version 2.0.0 RC4

- **KSeF certificates**
  - Added new `type` property in KSeF certificates.
  - Available certificate types:
    - `Authentication` – certificate for authentication in KSeF system,
    - `Offline` – certificate limited exclusively to confirming issuer authenticity and invoice integrity in offline mode (CODE II).
  - Updated documentation for `/certificates/enrollments`, `/certificates/query`, `/certificates/retrieve` processes.

- **QR codes**
  - Clarified that CODE II can only be generated based on `Offline` type certificate.
  - Added security warning that `Authentication` certificates cannot be used for offline invoice issuance.

- **Session status**
  - Authorization update - retrieving session, invoice and UPO information requires permission: ```InvoiceWrite```.
  - Changed *processing in progress* status code: from `300` to `150` for batch session.

- **Retrieve invoice metadata (`/invoices/query/metadata`)**  
Extended response model with fields:
  - `fileHash` – invoice SHA256 hash,
  - `hashOfCorrectedInvoice` – corrected offline invoice SHA256 hash,
  - `thirdSubjects` – third parties list,
  - `authorizedSubject` – authorized entity (new `InvoiceMetadataAuthorizedSubject` object containing `identifier`, `name`, `role`),
 - Added filtering by document type (`InvoiceQueryFormType`), available values: `FA`, `PEF`, `RR`. 
 - Field `schemaType` marked as deprecated – planned for removal in future API versions.


- **Documentation**
  - Added document describing [KSeF number](faktury/numer-ksef.md).
  - Added document describing [technical correction](offline/korekta-techniczna.md) for invoices issued in offline mode.
  - Clarified [duplicate detection](faktury/weryfikacja-faktury.md) method

- **OpenAPI**
  - Retrieve invoice metadata list 
    - Added property: `hasMore` (boolean) – informs about next page availability. Property `totalCount` was marked as deprecated (remains temporarily in response for backward compatibility).
    - In `dateRange` filtering property `to` (range end date) is no longer mandatory.
  - Search granted permissions - added `hasMore` property in response, removed `pageSize`, `pageOffset`.
  - Retrieve authentication status - removed redundant `referenceNumber`, `isCurrent` from response.
  - Pagination unification - endpoint `/sessions/{referenceNumber}/invoices` (retrieve session invoices) transitions to pagination based on `x-continuation-token` request header; removed `pageOffset` parameter, `pageSize` remains unchanged. First page without header; subsequent pages retrieved by passing token value returned by API. Change consistent with other resources using `x-continuation-token` (e.g. `/auth/sessions`, `/sessions/{referenceNumber}/invoices/failed`).
  - Removed `InternalId` identifier support in `targetIdentifier` field during indirect permission granting (`/permissions/indirect/grants`). From now only `Nip` identifier is allowed.
  - Permission granting operation status – extended list of possible status codes in response:
    - 410 – Given identifiers are inconsistent or in improper relation.
    - 420 – Used credentials do not have permissions to perform this operation.
    - 430 – Identifier context does not correspond to required role or permissions.
    - 440 – Operation not allowed for specified identifier bindings.
    - 450 – Operation not allowed for specified identifier or its type.
  - Added support for error **21418** – "Passed continuation token has invalid format" in all endpoints using pagination mechanism with `continuationToken` (`/auth/sessions`, `/sessions`, `/sessions/{referenceNumber}/invoices`, `/sessions/{referenceNumber}/invoices/failed`, `/tokens`).
  - Clarified invoice package retrieval process:
    - `/invoices/exports` – start invoice package creation process,
    - `/invoices/async-query/{operationReferenceNumber}` – check status and retrieve ready package.
  - Changed model name from `InvoiceMetadataQueryRequest` to `QueryInvoicesMetadataResponse`.
  - Extended `PersonPermissionsAuthorIdentifier` type with new `System` value (System identifier). This value is used to mark permissions granted by KSeF based on submitted ZAW-FA application. Change applies to endpoint: `/permissions/query/persons/grants`.

### Version 2.0.0 RC3

- **Added endpoint for retrieving invoice metadata list**  
  - `/invoices/query` (mock) replaced by `/invoices/query/metadata` – production endpoint for retrieving invoice metadata
  - Update of related data models.

- **Update of mock endpoint `invoices/async-query` for invoice retrieval query initialization**  
  Updated related data models.

- **OpenAPI**
  - Completed endpoint specification with required permissions (`x-required-permissions`).
  - Added `403 Forbidden` and `401 Unauthorized` responses in endpoint specification.
  - Added ```required``` attribute in permission query responses.
  - Updated description of endpoint  ```/tokens```
  - Removed duplicate ```enum``` definitions
  - Unified SessionInvoiceStatusResponse response model in ```/sessions/{referenceNumber}/invoices``` and ```/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}```.
  - Added validation status 400: "Authentication failed | No assigned permissions".

- **Session status**
  - Added status ```Cancelled``` - "Session cancelled. Batch session sending time exceeded, or no invoices sent in interactive session."
  - Added new error codes:
    - 415 - "Cannot send invoice with attachment"
    - 440 - "Session cancelled, sending time exceeded"
    - 445 - "Verification error, no correct invoices"

- **Invoice sending status**
  - Added date ```AcquisitionDate``` - KSeF number assignment date.
  - Field ```ReceiveDate``` replaced with ```InvoicingDate``` – invoice acceptance date to KSeF system.  

- **Invoice sending in session**
  - Added [validation](faktury/weryfikacja-faktury.md#ograniczenia-ilościowe) of zip package size (100 MB) and number of packages (50) in batch session
  - Added [validation](faktury/weryfikacja-faktury.md#ograniczenia-ilościowe) of invoice count in interactive and batch session.
  - Changed "Processing in progress" status code from 300 to 150.

- **Authentication using XAdES signature**  
  - Fixed ContextIdentifier in xsd AuthTokenRequest. Use corrected [XSD schema](https://api-test.ksef.mf.gov.pl/docs/v2/schemas/authv2.xsd). [XML document preparation](uwierzytelnianie.md#1-przygotowanie-dokumentu-xml-authtokenrequest)
  - Added error code`21117` - "Invalid entity identifier for specified context type".

- **Removal of anonymous invoice download endpoint ```invoices/download```**  
  Invoice downloading functionality without authentication has been removed; available exclusively in web-based KSeF tool for invoice verification and downloading.

- **Test data - invoice handling with attachments**  
  Added new endpoints enabling testing of invoice sending with attachments.

- **KSeF certificates - Key type and length validation in CSR**  
  - Completed POST ```/certificates/enrollments``` endpoint description with requirements for private key types in CSR (RSA, EC),
  - Added new error code 25010 in 400 response: "Invalid key type or length."

- **Public certificate format update**  
  `/security/public-key-certificates` – returns certificates in DER format encoded in Base64.


### Version 2.0.0 RC2
- **New endpoints for authentication session management**  
  Enable viewing and invalidating active authentication sessions.  
  [Authentication session management](auth/sesje.md)

- **New endpoint for retrieving invoice sending session list**\
  `/sessions` – enables retrieving metadata for sending sessions (interactive and batch), with filtering options including status, closing date and session type.\
  [Retrieving session list](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md#1-pobranie-listy-sesji)
  

- **Change in permissions listing**  
  `/permissions/query/authorizations/grants` – added query type (queryType) in [entity permissions](uprawnienia.md#pobranie-listy-uprawnień-podmiotowych-do-obsługi-faktur) filtering.

- **Support for new invoice schema version FA(3)**  
  When opening interactive and batch sessions, FA(3) schema selection is possible.

- **Added invoiceFileName field in batch session response**\
  `/sessions/{referenceNumber}/invoices` – added invoiceFileName field containing invoice file name. Field appears only for batch sessions.
   [Retrieve information about sent invoices](faktury/sesja-sprawdzenie-stanu-i-pobranie-upo.md#3-pobranie-informacji-na-temat-przesłanych-faktur)
