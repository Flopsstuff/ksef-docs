---
original: uprawnienia.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [uprawnienia.md](https://github.com/CIRFMF/ksef-docs/blob/main/uprawnienia.md)

## Permissions
10.07.2025

### Introduction – Business Context
The KSeF system introduces an advanced permission management mechanism that forms the foundation for secure and legally compliant use of the system by various entities. Permissions determine who can perform specific operations in KSeF – such as issuing invoices, viewing documents, granting additional permissions, or managing subordinate entities.

### Permission Management Objectives:
- Data security – limiting access to information only to persons and entities that are formally authorized to access it.
- Legal compliance – ensuring that operations are performed by appropriate entities in accordance with statutory requirements (e.g., VAT Act).
- Auditability – every operation related to granting or revoking permissions is recorded and can be analyzed.

### Who Grants Permissions?
Permissions can be granted by:

- entity owner - role (Owner),
- subordinate entity administrator,
- subordinate unit administrator,
- EU entity administrator,
- entity administrator, i.e., another entity or person possessing the CredentialsManage permission.

In practice, this means that every organization must manage the permissions of its employees, e.g., granting permissions to an accounting department employee when hiring a new employee or revoking permissions when such an employee terminates their employment.

### When Are Permissions Granted?
#### Examples:
- when starting cooperation with a new employee,
- when a company enters into cooperation, e.g., with an accounting office, it should grant invoice reading permissions to that accounting office so that the office can process the company's invoices,
- in connection with changes in relationships between entities.

### Structure of Granted Permissions:
Permissions are granted:
1) To natural persons identified by PESEL, NIP, or certificate fingerprint – for work in KSeF:
    - in the context of the entity granting the permission (directly granted permissions) or
    - in the context of another entity or other entities:
        - in the context of a subordinate entity identified by NIP (subordinate territorial self-government unit or VAT group member),
        - in the context of a subordinate unit identified by internal identifier,
        - in the complex NIP-VAT EU context linking a Polish entity with an EU entity authorized for self-invoicing on behalf of that Polish entity,
        - in the context of a specified entity identified by NIP – a client of the entity granting permissions (selective permissions granted indirectly),
        - in the context of all entities – clients of the entity granting permissions (general permissions granted indirectly).
2) To other entities – identified by NIP:
    - as final recipients of permissions to issue or view invoices,
    - as intermediaries - with the option to allow further permission delegation enabled, so that the authorized entity has the possibility to grant permissions indirectly (see points IV and V above).

3) To other entities to act in their own context on behalf of the authorizing entity (entity permissions):
    - tax representatives,
    - entities authorized for self-invoicing,
    - entities authorized to issue VAT RR invoices.

Access to system functions depends on the context in which authentication occurred and on the scope of permissions granted to the authenticated entity/person in that context.

## Glossary of Terms (in the scope of KSeF permissions)

| Term                          | Definition |
|---------------------------------|-----------|
| **Permission**                 | Authorization to perform specific operations in KSeF, e.g., `InvoiceWrite`, `CredentialsManage`. |
| **Owner**                       | Entity owner – a person who by default has full access to operations in the context of an entity having the same NIP identifier as recorded in the authentication method used; for the owner, the NIP-PESEL binding also applies, so they can also authenticate with a method containing the associated PESEL number while retaining all owner permissions. |
| **Subordinate Entity Administrator**              | Person with permission management rights (`CredentialsManage`) in the context of a subordinate entity. Can grant permissions (e.g., `InvoiceWrite`). A subordinate entity can be, for example, a VAT group member. |
| **Subordinate Unit Administrator**              | Person with permission management rights (`CredentialsManage`) in a subordinate unit. Can grant permissions (e.g., `InvoiceWrite`). |
| **EU Entity Administrator**              | Person identifying themselves with a certificate having permission management rights (`CredentialsManage`) in a complex context identified using NipVatUe. Can grant permissions (e.g., `InvoiceRead`). |
| **Intermediary Entity**   | Entity that received a permission with the `canDelegate = true` flag and can pass that permission on, i.e., grant permission indirectly. This can only be `InvoiceWrite` and `InvoiceRead` permissions. |
| **Target Entity**  | Entity in whose context the given permission applies – e.g., a company served by an accounting office. |
| **Granted Directly**       | Permission granted directly to a given user or entity by the owner or administrator. |
| **Granted Indirectly**          | Permission granted by an intermediary to handle another entity – only for `InvoiceRead` and `InvoiceWrite`. |
| **`canDelegate`**              | Technical flag (`true` / `false`) allowing permission delegation. Only `InvoiceRead` and `InvoiceWrite` can have `canDelegate = true`. Can only be used when granting permission to an entity for invoice handling |
| **`subjectIdentifier`**        | Data identifying the permission recipient (person or entity): `Nip`, `Pesel`, `Fingerprint`. |
| **`targetIdentifier` / `contextIdentifier`** | Data identifying the context in which the granted permission operates – e.g., client's NIP, internal identifier of organizational unit. |
| **Fingerprint**                | Result of calculating the SHA-256 hash function on a qualified certificate. Allows recognition of the certificate of an entity possessing permission granted on certificate fingerprint. Used, among others, in identifying foreign persons or entities. |
| **InternalId**                 | Internal identifier of a subordinate unit in the KSeF system - a two-part identifier consisting of a NIP number and five digits `nip-5_digits`.  |
| **NipVatUe**                   | Complex identifier, i.e., a two-part identifier consisting of the NIP number of a Polish entity and the VAT EU number of an EU entity, separated by a separator `nip-vat_ue`. |
| **Revocation**                     | Operation of revoking a previously granted permission. |
| **`permissionId`**             | Technical identifier of the granted permission – required, among others, for revocation operations. |
| **`operationReferenceNumber`** | Operation identifier (e.g., granting or revoking permissions), returned by the API, used to check status. |
| **Operation Status**            | Current state of the permission granting/revocation process: `100`, `200`, `400`, etc. |

## Role and Permission Model (Permission Matrix)

The KSeF system enables precise assignment of permissions, taking into account the types of activities performed by users. Permissions can be granted both directly and indirectly – depending on the access delegation mechanism.

### Examples of Roles to be Mapped Using Permissions:

| Role / entity                          | Role description                                                                                          | Possible permissions                                                                 |
|----------------------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| **Entity Owner**      | Role possessed by default automatically by the owner. To be recognized by the system as an owner, one must authenticate with a vector with the same NIP identifier as the NIP of the login context or associated PESEL number           | `Owner` role encompassing all invoice and administrative permissions except `VatUeManage`. |
| **Entity Administrator**            | Natural person possessing rights to grant and revoke permissions to other users and/or appointing administrators of subordinate units/entities.           | `CredentialsManage`, `SubunitManage`, `Introspection`.                              |
| **Operator (accounting / invoicing)** | Person responsible for issuing or viewing invoices.                                        | `InvoiceWrite`, `InvoiceRead`.                                                      |
| **Authorized Entity**                | Another business entity that has been granted specific permissions to issue invoices on behalf of the entity, e.g., Tax Representative.             | `SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`                             |
| **Intermediary Entity**              | Entity that received permissions with delegation option (`canDelegate`) and can grant them further.       | `InvoiceRead`, `InvoiceWrite` with flag `canDelegate = true`.   
| **EU Entity Administrator**     | Person identifying themselves with a certificate possessing rights to grant and revoke permissions to other users within an EU entity associated with a given Polish entity.                                     | `InvoiceWrite`, `InvoiceRead`,                                    `VatUeManage`,  `Introspection`.                      |                      |
| **EU Entity Representative**     | Person identifying themselves with a certificate acting on behalf of an EU entity associated with a given Polish entity.                                     | `InvoiceWrite`, `InvoiceRead`.                                                      |
| **Subordinate Unit Administrator** | User having the ability to appoint administrators in subordinate units or entities.               | `CredentialsManage`.                                                                    |

---

### Permission Classification by Type:

| Permission Type           | Example Values                                       | Possibility of Indirect Granting | Operational Description                                                              |
|--------------------------|------------------------------------------------------------|-------------------------------|------------------------------------------------------------------------------|
| **Invoice**             | `InvoiceWrite`, `InvoiceRead`                              | ✔️ (if `canDelegate=true`) | Invoice operations: sending, retrieving                     |
| **Administrative**       | `CredentialsManage`, `SubunitManage`,  `VatUeManage`.                       | ❌                            | Permission management, subordinate unit management                      |
| **Entity**        | `SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`        | ❌                            | Authorization of other entities to act (issue invoices) in their own context on behalf of the authorizing entity         |
| **Technical**            | `Introspection`                                            | ❌                            | Access to operation and session history                                         |

---

## General and Selective Permissions

The KSeF system enables granting selected permissions in a **general (generic)** or **selective (individual)** manner, which allows flexible management of access to data from many business partners.

###  Selective (Individual) Permissions

Selective permissions are those granted by an intermediary entity (e.g., accounting office) in relation to a **specific target entity (partner)**. They allow limiting the scope of access only to a selected client or organizational unit.

**Example:**  
XYZ accounting office received from ABC company the `InvoiceRead` permission with the flag `canDelegate = true`. Now it can pass this permission to its employee, but only in the context of ABC company – other companies served by XYZ are not covered by this access.

**Selectivity features:**
- It is necessary to specify `targetIdentifier` (e.g., partner's `Nip`).
- The permission recipient acts only in the context of the specified entity.
- Does not give access to data of other partners of the intermediary entity.

---

###  General (Generic) Permissions

General permissions are those granted without specifying a specific partner, which means that the recipient gains access to operations in the context of **all entities whose data is processed by the intermediary entity**.

**Example:**
Entity A has the `InvoiceRead` permission with `canDelegate = true` for many clients. It passes employee B a general `InvoiceRead` permission – B can now act on behalf of each of A's clients (e.g., view invoices of all contractors).

**Generality features:**
- The target entity identifier type `targetIdentifier` is `AllPartners`.
- Access covers all entities served by the intermediary.
- Used in case of mass integration, large shared service centers, or accounting systems.

---

### Technical Notes and Limitations

- The mechanism applies only to `InvoiceRead` and `InvoiceWrite` permissions granted indirectly.
- In practice, the difference lies in the presence (selective) or absence (general) of the `targetIdentifier` entity in the `POST /permissions/indirect/grants` request body.
- The system does not allow combining general and selective granting in one call – separate operations must be performed.
- General permissions should be used with caution, especially in production environments, due to their broad scope.

---

### Permission Assignment Structure:

1. **Direct granting** – e.g., administrator of entity A assigns user `InvoiceWrite` permission to a natural person in the context of entity A.
2. **Granting with the possibility of further transfer** – e.g., administrator of entity A grants entity B (intermediary) `InvoiceRead` permission with `canDelegate=true`, which enables administrator of entity B to grant `InvoiceRead` to entity/person C.
3. **Indirect granting** – using the dedicated endpoint /permissions/indirect/grants, where administrator of intermediary entity B, who received permission with delegation from entity A, grants permissions on behalf of target entity A to entity/person C.

---

### Example Permission Matrix:

| User / Entity       | InvoiceWrite | InvoiceRead | CredentialsManage | SubunitManage | TaxRepresentative |
|----------------------------|--------------|-------------|--------------------|----------------|--------------------|
| Anna Kowalska (PESEL)      | ✅           | ✅          | ❌                 | ❌             | ❌                 |
| XYZ Accounting Office (NIP) | ✅ (with delegation)          | ✅ (with delegation) | ❌                 | ❌             | ❌                 |
| Jan Nowak (Identifying with certificate)   | ✅           | ✅          | ❌                 | ❌             | ❌                 |
| Accounting department admin (PESEL)           | ❌           | ❌          | ✅                 | ✅             | ❌                 |
| Parent company i.e. owner (NIP)         | ✅           | ✅          | ✅                 | ✅             | ✅                 |
| VAT group admin (PESEL)          | ❌           | ❌          | ❌                 | ✅             | ❌                 |
| Tax representative (NIP)          | ❌           | ❌          | ❌                 | ❌             | ✅                 |

---

### Roles or Permissions Required for Granting Permissions 

| Granting permissions:                        | Required role or permission                      |
|-------------------------------------------|---------------------------------------------------|
| to natural person for work in KSeF      | `Owner` or `CredentialsManage`                   |
| to entity for invoice handling           | `Owner` or `CredentialsManage`                   |
| entity permissions | `Owner` or `CredentialsManage`                   |
| for invoice handling – indirectly              | `Owner` or `CredentialsManage`    |
| to subordinate unit administrator   | `SubunitManage`                                   |
| to EU entity administrator      | `Owner` or `CredentialsManage`    |
| to EU entity representative     | `VatUeManage`    |
---

### Identifier Limitations (`subjectIdentifier`, `contextIdentifier`)

| Identifier Type | Identified | Notes |
|--------------------|---------------------|-------|
| `Nip`              | Domestic entity     | For entities registered in Poland and natural persons |
| `Pesel`            | Natural person       | Required, among others, when granting permissions to employees using trusted profile or qualified certificate with PESEL number  |
| `Fingerprint`      | Certificate owner      | Used in situations when qualified certificate does not contain NIP or PESEL identifier and when identifying administrators or representatives of EU entities   |
| `NipVatUe`         | EU entities associated with Polish entities       | Required when granting permissions to administrators and representatives of EU entities |
| `InternalId`       | Subordinate units  | Used in entities with complex structure of subordinate units |

---

### API Functional Limitations

- Cannot grant the same permission twice – API may return an error or ignore the duplicate.
- Executing a permission granting operation does not result in immediate access – the operation is asynchronous and must be properly processed by the system (operation status should be checked).

---

### Time Limitations

- Granted permission remains active until it is revoked.
- Implementing time limitation requires logic on the client system side (e.g., permission revocation schedule).


## Granting Permissions


### Granting Permissions to Natural Persons for Work in KSeF.

Within organizations using KSeF, it is possible to grant permissions to specific natural persons – e.g., employees of accounting or IT departments. Permissions are assigned to a person based on their identifier (PESEL, NIP, or Fingerprint). Permissions can include both operational activities (e.g., issuing invoices) and administrative activities (e.g., managing permissions). This section describes how to grant such permissions via API and the permission requirements on the granting side.

POST [/permissions/persons/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1persons~1grants/post)


| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Identifier of entity or natural person. `"Nip"`, `"Pesel"`, `"Fingerprint"`             |
| `permissions`                               | Permissions to grant. `"CredentialsManage"`, `"CredentialsRead"`, `"InvoiceWrite"`, `"InvoiceRead"`, `"Introspection"`, `"SubunitManage"`, `"EnforcementOperations"`		   |
| `description`                              | Text value (description)              |
 

List of permissions that can be granted to a natural person:


| Permission | Description |
| :------------------ | :---------------------------------- |
| `CredentialsManage` | Permission management |
| `CredentialsRead` | Permission viewing |
| `InvoiceWrite` | Invoice issuing |
| `InvoiceRead` | Invoice viewing |
| `Introspection` | Session history viewing |
| `SubunitManage` | Subordinate unit management |
| `EnforcementOperations` | Enforcement operations execution |

 


Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\PersonPermission\PersonPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/PersonPermission/PersonPermissionE2ETests.cs)

```csharp
GrantPermissionsPersonRequest request = GrantPersonPermissionsRequestBuilder
    .Create()
    .WithSubject(subject)
    .WithPermissions(
        StandardPermissionType.InvoiceRead,
        StandardPermissionType.InvoiceWrite)
    .WithDescription(description)
    .Build();

OperationResponse response =
    await KsefClient.GrantsPermissionPersonAsync(request, accessToken, CancellationToken);
```

Example in Java:
[PersonPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/PersonPermissionIntegrationTest.java)

```java

GrantPersonPermissionsRequest request = new GrantPersonPermissionsRequestBuilder()
        .withSubjectIdentifier(new PersonPermissionsSubjectIdentifier(PersonPermissionsSubjectIdentifier.IdentifierType.PESEL, personValue))
        .withPermissions(List.of(PersonPermissionType.INVOICEWRITE, PersonPermissionType.INVOICEREAD))
        .withDescription("e2e test grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionPerson(request, accessToken);
```

Permissions can be granted by someone who is:
- owner
- possesses the `CredentialsManage` permission
- subordinate unit administrator who possesses `SubunitManage`
- EU entity administrator who possesses `VatUeManage`


---
### Granting Entities Permissions for Invoice Handling

KSeF enables granting permissions to entities that will process invoices on behalf of a given organization – e.g., accounting offices, shared service centers, or outsourcing companies. InvoiceRead and InvoiceWrite permissions can be granted directly and if necessary – with the possibility of further transfer (`canDelegate` flag). This section discusses the mechanism of granting these permissions, required roles, and example implementations.

POST [/permissions/entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1entities~1grants/post)


* **InvoiceWrite (Invoice issuing)**: This permission enables sending invoice files in XML format to the KSeF system. After successful verification and KSeF number assignment, these files become structured invoices.
* **InvoiceRead (Invoice viewing)**: With this permission, an entity can retrieve invoice lists within a given context, download invoice contents, invoices, report abuse, and generate and view collective payment identifiers.
* **InvoiceWrite** and **InvoiceRead** permissions can be granted directly to entities by the authorizing entity. The API client that grants these permissions directly must possess the **CredentialsManage** permission or **Owner** role. When granting permissions to entities, it is possible to set the `canDelegate` flag to `true` for **InvoiceRead** and **InvoiceWrite**, which allows further, indirect transfer of this permission.



| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Entity identifier. `"Nip"`               |
| `permissions`                               | Permissions to grant. `"InvoiceWrite"`, `"InvoiceRead"`			   |
| `description`                              | Text value (description)              |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EntityPermission\EntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EntityPermission/EntityPermissionE2ETests.cs)

```csharp
GrantPermissionsEntityRequest request = GrantEntityPermissionsRequestBuilder
    .Create()
    .WithSubject(subject)
    .WithPermissions(
        Permission.New(StandardPermissionType.InvoiceRead, true),
        Permission.New(StandardPermissionType.InvoiceWrite, false)
    )
    .WithDescription(description)
    .Build();

OperationResponse response = await KsefClient.GrantsPermissionEntityAsync(request, accessToken, CancellationToken);
```
Example in Java:
[EntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EntityPermissionIntegrationTest.java)

```java
GrantEntityPermissionsRequest request = new GrantEntityPermissionsRequestBuilder()
        .withPermissions(List.of(
                new EntityPermission(EntityPermissionType.INVOICE_READ, true),
                new EntityPermission(EntityPermissionType.INVOICE_WRITE, false)))
        .withDescription(DESCRIPTION)
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, targetNip))
        .build();

OperationResponse response = ksefClient.grantsPermissionEntity(request, accessToken);
```

---
### Granting Entity Permissions

For selected invoicing processes, KSeF provides so-called entity permissions, which are applicable in the context of invoicing on behalf of another entity (`TaxRepresentative`, `SelfInvoicing`, `RRInvoicing`). These permissions can only be granted by the owner or administrator possessing `CredentialsManage`. This section presents the method of granting them, application, and technical limitations.

POST [/permissions/authorizations/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1authorizations~1grants/post)

Used for granting so-called entity permissions, such as `SelfInvoicing` (self-invoicing), `RRInvoicing` (RR self-invoicing), or `TaxRepresentative` (tax representative operations).

Nature of permissions:

These are entity permissions, which means they are important when sending invoice files by an entity and verified in their validation process. The relationship between the entity and the data on invoices is verified. They can be changed during a session. 

Required permissions for granting permissions: ```CredentialsManage``` or ```Owner```.

| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Entity identifier. `"Nip"`               |
| `permissions`                               | Permissions to grant. `"SelfInvoicing"`, `"RRInvoicing"`, `"TaxRepresentative"`			   |
| `description`                              | Text value (description)              |


Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\AuthorizationPermission\AuthorizationPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/AuthorizationPermission/AuthorizationPermissionsE2ETests.cs)

```csharp
GrantPermissionsAuthorizationRequest grantPermissionsAuthorizationRequest = GrantAuthorizationPermissionsRequestBuilder
    .Create()
    .WithSubject(new AuthorizationSubjectIdentifier
    {
        Type = AuthorizationSubjectIdentifierType.PeppolId,
        Value = peppolId
    })
    .WithPermission(AuthorizationPermissionType.PefInvoicing)
    .WithDescription($"E2E: Nadanie uprawnienia do wystawiania faktur PEF dla firmy {companyNip} (na wniosek {peppolId})")
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsAuthorizationPermissionAsync(grantPermissionAuthorizationRequest,
    accessToken, CancellationToken);
```

Example in Java:
[ProxyPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ProxyPermissionIntegrationTest.java)

```java
GrantAuthorizationPermissionsRequest request = new GrantAuthorizationPermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, subjectNip))
        .withPermission(InvoicePermissionType.SELF_INVOICING)
        .withDescription("e2e test grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionsProxyEntity(request, accessToken);
```
---
### Indirect Permission Granting

The indirect permission granting mechanism enables the operation of a so-called intermediary entity, which – based on previously obtained delegations – can pass selected permissions further, in the context of another entity. This most often concerns accounting offices that serve many clients. This section describes the conditions that must be met to use this functionality and presents the data structure required to perform such granting.

`InvoiceWrite` and `InvoiceRead` permissions are the only permissions that can be granted indirectly. This means that an intermediary entity can grant these permissions to another entity (authorized), which will apply in the context of the target entity (partner). These permissions can be selective (for a specific partner) or general (for all partners of the intermediary entity). In the case of selective granting, the target entity identifier should specify type `"Nip"` and the value of a specific NIP number. In the case of general permissions, the target entity identifier should specify type `"AllPartners"`, without filling the `value` field.

POST [/permissions/indirect/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1indirect~1grants/post)



| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Natural person identifier. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `targetIdentifier`                        | Target entity identifier. `"Nip"` or `null`              |
| `permissions`                               | Permissions to grant. `"InvoiceRead"`, `"InvoiceWrite"`			   |
| `description`                              | Text value (description)              |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\IndirectPermission\IndirectPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/IndirectPermission/IndirectPermissionE2ETests.cs)

```csharp
GrantPermissionsIndirectEntityRequest request = GrantIndirectEntityPermissionsRequestBuilder
    .Create()
    .WithSubject(subject)
    .WithContext(new TargetIdentifier { Type = TargetIdentifierType.Nip, Value = targetNip })
    .WithPermissions(StandardPermissionType.InvoiceRead, StandardPermissionType.InvoiceWrite)
    .WithDescription(description)
    .Build();

OperationResponse grantOperationResponse = await KsefClient.GrantsPermissionIndirectEntityAsync(request, accessToken, CancellationToken);
```

Example in Java:
[IndirectPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IndirectPermissionIntegrationTest.java)

```java
GrantIndirectEntityPermissionsRequest request = new GrantIndirectEntityPermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, subjectNip))
        .withTargetIdentifier(new TargetIdentifier(TargetIdentifier.IdentifierType.NIP, targetNip))
        .withPermissions(List.of(INVOICE_WRITE))
        .withDescription("E2E indirect grantE2E indirect grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionIndirectEntity(request, accessToken);

```
---
### Granting Subordinate Entity Administrator Permissions

The organizational structure of an entity may include subordinate units or entities – e.g., branches, departments, subsidiaries, VAT group members, and territorial self-government units. KSeF enables assigning permissions to manage such units. The `SubunitManage` permission is required. This section presents the method of granting administrative permissions in the context of a subordinate unit or subordinate entity, taking into account the `InternalId` or `Nip` identifier.

POST [/permissions/subunits/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1subunits~1grants/post)



Required permissions for granting:

- The user who wants to grant these permissions must possess the ```SubunitManage``` (Subordinate unit management) permission. 

| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Natural person or entity identifier. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `contextIdentifier`                        | Subordinate entity identifier. `"Nip"`, `InternalId`              |
| `subunitName`                              | Subordinate unit name              |
| `description`                              | Text value (description)              |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
GrantPermissionsSubunitRequest subunitGrantRequest =
    GrantSubunitPermissionsRequestBuilder
    .Create()
    .WithSubject(_fixture.SubjectIdentifier)
    .WithContext(new SubunitContextIdentifier
    {
        Type = SubunitContextIdentifierType.InternalId,
        Value = Fixture.UnitNipInternal
    })
    .WithSubunitName("E2E Test Subunit")
    .WithDescription("E2E test grant sub-unit")
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsPermissionSubUnitAsync(grantPermissionsSubUnitRequest, accessToken, CancellationToken);
```
Example in Java:

[SubUnitPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubUnitPermissionIntegrationTest.java)

```java
SubunitPermissionsGrantRequest request = new SubunitPermissionsGrantRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, subjectNip))
        .withContextIdentifier(new ContextIdentifier(ContextIdentifier.IdentifierType.INTERNALID, contextNip))
        .withDescription("e2e subunit test")
        .withSubunitName("test")
        .build();

OperationResponse response = ksefClient.grantsPermissionSubUnit(request, accessToken);

```
---
### Granting EU Entity Administrator Permissions

Granting EU entity administrator permissions in KSeF allows authorizing an entity or person designated by an EU entity having the right to self-invoice on behalf of the Polish entity granting the permission. Executing this operation results in the person thus authorized gaining the ability to log in in a complex context: `NipVatUe`, linking the Polish entity granting the permission with the EU entity having the right to self-invoice. After granting EU entity administrator permissions, such person will be able to perform operations on invoices, as well as manage permissions of other persons (so-called EU entity representatives) within this complex context.

POST [/permissions/eu-entities/administration/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1eu-entities~1administration~1grants/post)



| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Natural person or entity identifier. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `contextIdentifier`                        | Two-part identifier consisting of NIP number and VAT-EU number `{nip}-{vat_ue}`. `"NipVatUe"`              |
| `description`                              | Text value (description)              |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuEntityPermission\EuEntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuEntityPermission/EuEntityPermissionE2ETests.cs)

```csharp
GrantPermissionsEuEntityRequest grantPermissionsEuEntityRequest = GrantEUEntityPermissionsRequestBuilder
    .Create()
    .WithSubject(TestFixture.EuEntity)
    .WithSubjectName(EuEntitySubjectName)
    .WithContext(contextIdentifier)
    .WithDescription(EuEntityDescription)
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsPermissionEUEntityAsync(grantPermissionsRequest, accessToken, CancellationToken);
```
Example in Java:
[EuEntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityPermissionIntegrationTest.java)

```java
EuEntityPermissionsGrantRequest request = new GrantEUEntityPermissionsRequestBuilder()
        .withSubject(new SubjectIdentifier(SubjectIdentifier.IdentifierType.FINGERPRINT, euEntity))
        .withEuEntityName("Sample Subject Name")
        .withContext(new ContextIdentifier(ContextIdentifier.IdentifierType.NIP_VAT_UE, nipVatUe))
        .withDescription("E2E EU Entity Permission Test")
        .build();

OperationResponse response = ksefClient.grantsPermissionEUEntity(request, accessToken);

```
---
### Granting EU Entity Representative Permissions

An EU entity representative is a person acting on behalf of a unit registered in the EU that needs access to KSeF to view or issue invoices. Such permission can only be granted by a VAT EU administrator. This section presents the data structure and method of calling the appropriate endpoint.

POST [/permissions/eu-entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1eu-entities~1grants/post)



| Field                                       | Value                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Entity identifier. `"Fingerprint"`               |
| `permissions`                               | Permissions to grant. `"InvoiceRead"`, `"InvoiceWrite"`			   |
| `description`                              | Text value (description)              |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuRepresentativePermission\EuRepresentativePermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuRepresentativePermission/EuRepresentativePermissionE2ETests.cs)

```csharp
GrantPermissionsEuEntityRepresentativeRequest grantRepresentativePermissionsRequest = GrantEUEntityRepresentativePermissionsRequestBuilder
    .Create()
    .WithSubject(new Client.Core.Models.Permissions.EUEntityRepresentative.SubjectIdentifier
    {
        Type = Client.Core.Models.Permissions.EUEntityRepresentative.SubjectIdentifierType.Fingerprint,
        Value = euRepresentativeEntityCertificateFingerprint
    })
    .WithPermissions(
        StandardPermissionType.InvoiceWrite,
        StandardPermissionType.InvoiceRead
        )
    .WithDescription("Representative for EU Entity")
    .Build();

OperationResponse grantRepresentativePermissionResponse = await KsefClient.GrantsPermissionEUEntityRepresentativeAsync(grantRepresentativePermissionsRequest,
    euAuthInfo.AccessToken.Token,
    CancellationToken.None);
```
Example in Java:
[EuEntityRepresentativePermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityRepresentativePermissionIntegrationTest.java)

```java
GrantEUEntityRepresentativePermissionsRequest request = new GrantEUEntityRepresentativePermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.FINGERPRINT, fingerprint))
        .withPermissions(List.of(EuEntityPermissionType.INVOICE_WRITE, EuEntityPermissionType.INVOICE_READ))
        .withDescription("Representative for EU Entity")
        .build();

OperationResponse response = ksefClient.grantsPermissionEUEntityRepresentative(request, accessToken);


```

## Revoking Permissions

The process of revoking permissions in KSeF is as important as granting them – it ensures access control and enables quick response in situations such as changing an employee's role, terminating cooperation with an external partner, or violating security rules. Permission revocation can be performed for each category of recipient: natural person, entity, subordinate unit, EU representative, or EU administrator. This section discusses methods of withdrawing various types of permissions and required identifiers.

### Revoking Permissions

Standard permission revocation method that can be used in relation to most cases: natural persons, domestic entities, subordinate units, as well as EU representatives or EU administrators. The operation requires knowledge of `permissionId` and possession of appropriate permission. 

DELETE [/permissions/common/grants/\{permissionId\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Odbieranie-uprawnien/paths/~1permissions~1common~1grants~1%7BpermissionId%7D/delete)

This method is used to revoke permissions such as:

- granted to natural persons for work in KSeF,
- granted to entities for invoice handling,
- granted indirectly,
- subordinate entity administrator,
- EU entity administrator,
- EU entity representative.

Example in C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
OperationResponse operationResponse = await KsefClient.RevokeCommonPermissionAsync(permission.Id, accessToken, CancellationToken);
```

Example in Java:
[EntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EntityPermissionIntegrationTest.java)

```java
OperationResponse response = ksefClient.revokeCommonPermission(permissionId, accessToken);
```
---
### Revoking Entity Permissions

In the case of entity-type permissions (`SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`), a separate revocation method applies – using an endpoint dedicated to authorization operations. These types of permissions are not transferable, so their revocation has immediate effect and ends the possibility of performing invoice operations in the given mode. Knowledge of `permissionId` is required.

DELETE [/permissions/authorizations/grants/\{permissionId\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Odbieranie-uprawnien/paths/~1permissions~1authorizations~1grants~1%7BpermissionId%7D/delete)

This method is used to revoke permissions such as:

- self-invoicing,
- RR self-invoicing,
- tax representative operations.

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuEntityPermission\EuEntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuEntityPermission/EuEntityPermissionE2ETests.cs)

```csharp
await ksefClient.RevokeAuthorizationsPermissionAsync(permissionId, accessToken, cancellationToken);
```

Example in Java:
[ProxyPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ProxyPermissionIntegrationTest.java)

```java
OperationResponse response = ksefClient.revokeAuthorizationsPermission(operationId, accessToken);
```


## Searching Granted Permissions

KSeF provides a set of endpoints that allow querying the list of active permissions granted to users and entities. These mechanisms are essential for auditing, reviewing access status, and when building administrative interfaces (e.g., for managing access structure in an organization). This section contains a review of search methods divided by categories of granted permissions.

---
### Retrieving List of Own Permissions

The query allows retrieving a list of permissions possessed by the authenticated entity.
 This list includes permissions:
- granted directly in the current context
- granted by the parent entity
- granted indirectly, where the context is the intermediary or target entity
- granted to the entity for invoice handling (`"InvoiceRead"` and `"InvoiceWrite"`) by another entity, if the authenticated entity has owner permissions (`"Owner"`) 

POST [/permissions/query/personal/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1personal~1grants/post)

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\PersonPermission\PersonalPermissions_AuthorizedPesel_InNipContext_E2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/PersonPermission/PersonalPermissions_AuthorizedPesel_InNipContext_E2ETests.cs)
```csharp
PersonalPermissionsQueryRequest query = new PersonalPermissionsQueryRequest
{
    ContextIdentifier = /*...*/,
    TargetIdentifier = /*...*/,
    PermissionTypes = /*...*/,
    PermissionState = /*...*/
};

PagedPermissionsResponse<PersonalPermission> searchedGrantedPersonalPermissions = 
    await KsefClient.SearchGrantedPersonalPermissionsAsync(query, entityAuthorizationInfo.AccessToken.Token);
```

Example in Java:
[SearchPersonalGrantPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SearchPersonalGrantPermissionIntegrationTest.java)

```java
QueryPersonalGrantResponse response = ksefClient.searchPersonalGrantPermission(request, pageOffset, pageSize, token.accessToken());

```

---
### Retrieving List of Invoice Handling Permissions in Current Context

The method allows reading received invoice handling permissions in the current login context. 
 This list includes permissions:
- granted to the entity for invoice handling by another entity 

POST [/permissions/query/entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~entities~1grants/post)

| Field                  | Description                                                                 |
| :-------------------- | :------------------------------------------------------------------- |
| `contextIdentifier`    | identifier of the entity that granted the permission for invoice handling.   ```Nip```, ```InternalId```  |

Example in C#:
```
```

Example in Java:
```
```

---
### Retrieving List of Permissions Granted to Natural Persons or Entities for Work in KSeF

The query allows retrieving a list of permissions granted to natural persons or entities – e.g., company employees. Filtering by permission type, state (`Active` / `Inactive`), as well as grantor and recipient identifier is possible. This endpoint is sometimes used during onboarding, auditing, and monitoring personal permissions.

POST [/permissions/query/persons/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1persons~1grants/post)

| Field                  | Description                                                                 |
| :-------------------- | :------------------------------------------------------------------- |
| `authorIdentifier`    | Identifier of the entity granting permissions.   ```Nip```, ```Pesel```, ```Fingerprint```, ```System```                      |
| `authorizedIdentifier`| Identifier of the entity to whom permissions were granted.      ```Nip```, ```Pesel```,```Fingerprint```             |
| `targetIdentifier`    | Target entity identifier (for indirect permissions).  ```Nip```, ```AllPartners```      |
| `permissionTypes`     | Permission types for filtering.   `"CredentialsManage"`, `"CredentialsRead"`, `"InvoiceWrite"`, `"InvoiceRead"`, `"Introspection"`, `"SubunitManage"`, `"EnforcementOperations"`  |
| `permissionState`     | Permission state.  ```Active``` / ```Inactive```                                                  |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
PagedPermissionsResponse<Client.Core.Models.Permissions.PersonPermission> response =
    await KsefClient
    .SearchGrantedPersonPermissionsAsync(
        personPermissionsQueryRequest,
        accessToken,
        pageOffset: 0,
        pageSize: 10,
        CancellationToken);
```

Example in Java:
[PersonPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/PersonPermissionIntegrationTest.java)

```java
PersonPermissionsQueryRequest request = new PersonPermissionsQueryRequestBuilder()
        .withQueryType(PersonPermissionQueryType.PERMISSION_GRANTED_IN_CURRENT_CONTEXT)
        .build();

QueryPersonPermissionsResponse response = ksefClient.searchGrantedPersonPermissions(request, pageOffset, pageSize, accessToken);


```
---
### Retrieving List of Subordinate Unit and Entity Administrator Permissions

This endpoint is used to retrieve information about administrators of subordinate units or subordinate entities (e.g., branches, VAT groups). It allows monitoring who has administrative permissions relative to a given subordinate structure, identified using `InternalId` or `Nip`.

POST [/permissions/query/subunits/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1subunits~1grants/post)

| Field                  | Description                                                                 |
| :-------------------- | :------------------------------------------------------------------- |
| `subjectIdentifier`    | Subordinate entity identifier.   ```InternalId``` or `Nip`            |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
SubunitPermissionsQueryRequest subunitPermissionsQueryRequest = new SubunitPermissionsQueryRequest();
PagedPermissionsResponse<Client.Core.Models.Permissions.SubunitPermission> response =
    await KsefClient
    .SearchSubunitAdminPermissionsAsync(
        subunitPermissionsQueryRequest,
        accessToken,
        pageOffset: 0,
        pageSize: 10,
        CancellationToken);
```

Example in Java:
[SubUnitPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubUnitPermissionIntegrationTest.java)

```java
SubunitPermissionsQueryRequest request = new SubunitPermissionsQueryRequestBuilder()
        .withSubunitIdentifier(new SubunitPermissionsSubunitIdentifier(SubunitPermissionsSubunitIdentifier.IdentifierType.INTERNALID, subUnitNip))
        .build();

QuerySubunitPermissionsResponse response = ksefClient.searchSubunitAdminPermissions(request, pageOffset, pageSize, accessToken);


```
---
### Retrieving Entity Role List

The endpoint returns a set of roles assigned to the context in which we are authenticated (i.e., on whose behalf the query is executed). Function mainly used for automatic access checking by client systems.

GET [/permissions/query/entities/roles](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1entities~1roles/get)

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
PagedRolesResponse<EntityRole> response =
    await KsefClient
    .SearchEntityInvoiceRolesAsync(
        accessToken,
        pageOffset: 0,
        pageSize: 10,
        CancellationToken);
```

Example in Java:
[SearchEntityInvoiceRoleIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SearchEntityInvoiceRoleIntegrationTest.java)

```java
QueryEntityRolesResponse response = ksefClient.searchEntityInvoiceRoles(0, 10, token);
```
---
### Retrieving List of Subordinate Entities

Allows obtaining information about related subordinate entities for the context in which we are authenticated (i.e., on whose behalf the query is executed). Function mainly used to verify the structure of territorial self-government units or VAT groups.

POST [/permissions/query/subordinate-entities/roles](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1subordinate-entities~1roles/post)

| Field                     | Description                                                                                                              |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `subordinateEntityIdentifier`   | Identifier of the entity to whom permissions were granted. ```Nip```                                                     |                                               |
    

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
SubordinateEntityRolesQueryRequest subordinateEntityRolesQueryRequest = new SubordinateEntityRolesQueryRequest();
PagedRolesResponse<SubordinateEntityRole> response =
    await KsefClient
    .SearchSubordinateEntityInvoiceRolesAsync(
        subordinateEntityRolesQueryRequest,
        accessToken,
        pageOffset: 0,
        pageSize: 10,
        CancellationToken);
```

Example in Java:
[SearchSubordinateQueryIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SearchSubordinateQueryIntegrationTest.java)

```java
SubordinateEntityRolesQueryResponse response = ksefClient.searchSubordinateEntityInvoiceRoles(queryRequest, pageOffset, pageSize,accessToken);
```
---
### Retrieving List of Entity Permissions for Invoice Handling

This endpoint is used to review all granted entity permissions granted by the context in which we are authenticated or granted to the context in which we are authenticated. Supports filtering by permission type and recipient.



POST [/permissions/query/authorizations/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1authorizations~1grants/post)

| Field                     | Description                                                                                                              |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `authorizingIdentifier`  | Identifier of the entity granting permissions.  ```Nip```                                                     |
| `authorizedIdentifier`   | Identifier of the entity to whom permissions were granted. ```Nip```                                                     |
| `queryType`              | Query type. Determines whether we query about granted or received permissions. ```Granted``` ```Received```            |
| `permissionTypes`        | Permission types for filtering.   `"SelfInvoicing"`, `"TaxRepresentative"`, `"RRInvoicing"`,                       |
 

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
PagedAuthorizationsResponse<AuthorizationGrant> response =
        await KsefClient
        .SearchEntityAuthorizationGrantsAsync(
            entityAuthorizationsQueryRequest,
            accessToken,
            pageOffset: 0,
            pageSize: 10,
            CancellationToken);
```

Example in Java:
[ProxyPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ProxyPermissionIntegrationTest.java)

```java
        EntityAuthorizationPermissionsQueryRequest request = new EntityAuthorizationPermissionsQueryRequestBuilder()
        .withQueryType(QueryType.GRANTED)
        .build();

QueryEntityAuthorizationPermissionsResponse response = ksefClient.searchEntityAuthorizationGrants(request, pageOffset, pageSize, accessToken);


```
---
### Retrieving List of EU Entity Administrator or Representative Permissions Authorized for Self-invoicing

EU entities can also have permissions assigned for using KSeF. In this section, it is possible to retrieve information about the access granted to them, taking into account VAT EU identifiers and certificate fingerprints.

POST [/permissions/query/eu-entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1eu-entities~1grants/post)

| Field                        | Description                                                                 |
| :-------------------------- | :------------------------------------------------------------------- |
| `vatUeIdentifier`           | VAT EU identifier.                                                |
| `authorizedFingerprintIdentifier` | Certificate fingerprint of the authorized entity.                      |
| `permissionTypes`           | Permission types for filtering. Possible values are: `VatUeManage`, `InvoiceWrite`, `InvoiceRead`, `Introspection`. |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
PagedPermissionsResponse<Client.Core.Models.Permissions.EuEntityPermission> response =
    await KsefClient
    .SearchGrantedEuEntityPermissionsAsync(
        euEntityPermissionsQueryRequest,
        accessToken,
        pageOffset: 0,
        pageSize: 10,
        CancellationToken);
```

Example in Java:
[EuEntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityPermissionIntegrationTest.java)

```java
EuEntityPermissionsQueryRequest request = new EuEntityPermissionsQueryRequestBuilder()
   .withAuthorizedFingerprintIdentifier(subjectContext)
   .build();

QueryEuEntityPermissionsResponse response = createKSeFClient().searchGrantedEuEntityPermissions(request, pageOffset, pageSize, accessToken);
```

## Operations 

The National e-Invoice System enables tracking and verification of the status of operations related to permission management. Each permission granting or revocation is implemented as an asynchronous operation whose status can be monitored using a unique reference identifier (`referenceNumber`). This section presents the mechanism for retrieving operation status and its interpretation in the context of automation and control of the correctness of administrative actions in KSeF.

### Retrieving Operation Status

After granting or revoking a permission, the system returns an operation reference number (`referenceNumber`). With this identifier, it is possible to check the current state of request processing: whether it ended successfully, whether an error occurred, or whether processing is still ongoing. This information can be crucial in monitoring systems, automatic operation retry logic, or administrative action reporting. This section presents an example of an API call to retrieve operation status.

GET [/permissions/operations/{referenceNumber}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Operacje/paths/~1permissions~1operations~1%7BreferenceNumber%7D/get)

Each permission granting operation returns an operation identifier that should be used to check the status of that operation.

Example in C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
var operationStatus = await ksefClient.OperationsStatusAsync(referenceNumber, accessToken, cancellationToken);
```

Example in Java:
[EuEntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityPermissionIntegrationTest.java)

```java
PermissionStatusInfo status = ksefClient.permissionOperationStatus(referenceNumber, accessToken);
```

### Checking Status of Consent for Issuing Invoices with Attachments

Consent is required to issue invoices containing attachments and applies within the current context (`ContextIdentifier`) used during authentication. Consent is granted outside the API, exclusively in the e-Tax Office service, and applications can be submitted from January 1, 2026. The API does not provide an operation to submit consent

GET [/permissions/attachments/status](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Operacje/paths/~1permissions~1attachments~1status/get)

Returns consent status for the current context. If consent is not active, an invoice with attachment sent to the KSeF API will be rejected.

Example in C#:
[KSeF.Client.Tests.Core\E2E\TestData\TestDataE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/TestData/TestDataE2ETests.cs)
```csharp
PermissionsAttachmentAllowedResponse attachmentPermissionStatus = await KsefClient.GetAttachmentPermissionStatusAsync(authOperationStatusResponse.AccessToken.Token)
```

Example in Java:
[PermissionAttachmentStatusIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/PermissionAttachmentStatusIntegrationTest.
