---
original: przeglad-kluczowych-zmian-ksef-api-2-0.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [przeglad-kluczowych-zmian-ksef-api-2-0.md](https://github.com/CIRFMF/ksef-docs/blob/main/przeglad-kluczowych-zmian-ksef-api-2-0.md)

# KSeF API 2.0 – Overview of Key Changes
09.06.2025

# Introduction

This document is addressed to technical teams and developers with experience in KSeF API version 1.0. It contains an overview of the most important changes introduced in version 2.0, along with a discussion of new capabilities and practical integration improvements.

The purpose of this document is to:

- Identify the main differences compared to version 1.0
- Present the benefits of migrating to version 2.0
- Facilitate preparation of integrations for system requirements implemented on February 1, 2026

---

## Documentation and tools supporting integration with KSeF API 2.0

To facilitate the transition to the new API version and ensure proper implementation, a set of official materials and tools supporting integrators has been made available:

**Technical documentation (OpenAPI)**

KSeF API version 2.0 has been described in the OpenAPI standard, which enables both easy browsing of documentation by developers and automatic generation of integration code.

* **Documentation** (interactive online version):  
  Browser interface in the form of a web page, presenting descriptions of API methods, data models, parameters and usage examples. Intended for developers and integration analysts: [[link](https://api-test.ksef.mf.gov.pl/docs/v2/index.html)].

* **Specification** (OpenAPI JSON file):  
  Raw OpenAPI specification file in JSON format, intended for use in tools automating integration (e.g., code generators, API contract validators): [[link](https://api-test.ksef.mf.gov.pl/docs/v2/openapi.json)].

**Official KSeF 2.0 Client integration library (open source)**

Public library made available on an open source basis, developed in parallel with subsequent API versions and maintained in full compliance with the specification. It constitutes the recommended integration tool, enabling current tracking of changes and reducing the risk of incompatibility with current system releases.

* **C\#:** \[[link](https://github.com/CIRFMF/ksef-client-csharp)\]

* **Java:** \[[link](https://github.com/CIRFMF/ksef-client-java)\]

**Published packages**

The KSeF 2.0 Client library will be available in official package repositories for the most popular programming languages. For the .NET platform, it will be published as a NuGet package, while for the Java environment – as a Maven Central artifact. Publishing in these repositories will enable easy inclusion of the library in projects and automatic tracking of updates compatible with subsequent API versions.

**Step-by-step guide**

* **Integration guide / tutorial:**  
  Practical step-by-step instructions along with code fragments illustrating how to use key system endpoints.
  <br/>\[[link](https://github.com/CIRFMF/ksef-docs)\]

# Key Changes in API 2.0

## New JWT-based authentication model ##

In version 1.0, authentication was tightly coupled with opening an interactive session, which introduced many limitations and complicated integration.

In version 2.0:

* Authentication has been **separated as an independent process**, independent of session initialization.

* **Standard JWT tokens** have been introduced, which are used to authorize all protected operations.

Benefits:

* compliance with market practices,  
* ability to reuse tokens to create multiple sessions,  
* **support for token refresh and revocation**.

Authentication process details: \[[link](https://github.com/CIRFMF/ksef-docs/blob/main/uwierzytelnianie.md)\]

## Unified initialization process for batch and interactive sessions

In API 2.0, the session opening process has been unified and made independent of the operating mode. After obtaining an authentication token, you can open both an interactive session: POST /sessions/online, and a batch session: POST /sessions/batch.

In both cases, a simple JSON is passed containing:

* form code (formCode),

* encrypted AES key for encrypting invoice data (encryptionKey).

In the case of batch sending, a list of partial files along with metadata included in the package is also passed.

Details and usage examples: 
* interactive sending \[[link](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-interaktywna.md)\]
* batch sending \[[link](https://github.com/CIRFMF/ksef-docs/blob/main/sesja-wsadowa.md)\]

## Mandatory encryption of all invoices

In version 1.0, invoice encryption was mandatory only in batch mode. In interactive mode, the ability to encrypt existed, but was optional.

In version 2.0, encryption of all invoices – both in batch and interactive mode – **is required**.

Each invoice or package of invoices must be encrypted locally by the client using an **AES key**, which:

* is generated individually for each session,

* passed to the system during session opening (encryptionKey).


## Asymmetric encryption

In version 2.0, `RSA-OAEP` with `SHA-256` and `MGF1-SHA256` has been introduced. Encryption of KSeF tokens is performed with a separate key from the encryption of the symmetric key used for invoices.

Current **public key certificates** are returned by the public endpoint: GET `/security/public-key-certificates`

## Consistency and new naming convention in API 2.0

One of the key changes in KSeF API 2.0 is the unification and simplification of the naming convention for resources, parameters, and JSON models. In version 1.0, the API contained a number of inconsistencies and excessive complexity resulting from system evolution.

In version 2.0:

* **Endpoints** gained readable, REST-ful naming (e.g., sessions/online, auth/token, permissions/entities/grants).

* **Operation names** have been simplified and reflect the actual action (e.g., grant, revoke, refresh).

* The structure of **headers, parameters, and data formats** has been organized to be consistent and compliant with REST API design best practices.

* **Data structures** are flat and clear – identifier and permission types have explicitly defined enum types (Nip, Pesel, Fingerprint), without the need to analyze subtypes.

Changes in version 2.0 also include updates to names and data structures. Although a complete map of these changes has not been presented in this document, it is available in the OpenAPI v2 documentation and in code examples in the official GitHub repository.

It should be emphasized that the changes are not drastic in nature – they **do not affect** the general logic of the KSeF system operation, but only organize and simplify naming and structures, making the API more transparent and intuitive to use.

Migration to version 2.0 should be treated as a change in integration contract and requires adaptation of implementation on the side of external systems. It is recommended to use the official integration library **KSeF 2.0 Client**, developed and maintained by the team responsible for the API. This library implements all available endpoints and data models, which significantly facilitates the migration process and provides stable support also in future system versions.

## New module for managing internal certificates

As part of KSeF API version 2.0, mechanisms have been introduced enabling the issuance and management of internal **KSeF certificates** \[link to documentation\]. The certificates will enable authentication in KSeF and are necessary for issuing invoices in offline mode \[link to documentation\].

Entities that successfully complete the authentication process will be able to:

* submit an application for issuing an internal KSeF certificate, containing selected attributes from the signature certificate used during authentication,

* download the issued certificate in digital form,

* check the status of a submitted certificate issuance application,

* download a list of metadata for issued certificates,

* check the available certificate limit.

## Batch sending process improvement

In KSeF API version 2.0, a significant improvement has been introduced in the area of batch session processing. The previous solution available in API 1.0 was inefficient – if even one invoice in a package contained an error, the entire shipment was rejected. This approach effectively limited the use of batch mode by integrators and caused significant operational difficulties.

In the new solution, when sending a package of documents:

* each invoice is processed independently,

* any errors affect only specific invoices, not the entire shipment,

* the number of erroneous invoices is returned for the session status,

* a dedicated endpoint is available that allows downloading the detailed status of incorrectly processed invoices along with information about any errors.

This change significantly improves the reliability and efficiency of batch mode and is based on the same package sending model without the risk of losing the entire package due to individual errors.

## Invoice duplicate verification  
The method of detecting duplicates has been changed – business data of the invoice is now checked (Podmiot1:NIP, RodzajFaktury, P_2), not the file hash. Details – [Invoice verification](faktury/weryfikacja-faktury.md).

## Changes in the Permissions module

Changes in the permissions module involve changing some aspects of their functioning logic in KSeF 2.0.

In response to reported comments, version 2.0 of the system introduced a mechanism for granting permissions indirectly, which replaces the previous principle of inheriting permissions to view and issue invoices. The new interface enables separation of viewing client (partner) invoices and the ability to issue invoices on their behalf from viewing invoices and issuing own invoices of the entity (e.g., accounting office).

The mechanism consists of granting an entity permission by the client to view or issue invoices with a special option enabled that allows further transfer of this permission by the authorized entity. After receiving such permission, the entity can grant it, for example, to its employees. After performing these actions, these employees will be able to service the indicated client within the scope specified by the granted permissions.

It is also possible for an entity to grant so-called general permissions, which allow an employee authorized in this way to service all clients of the entity – of course, to the extent that these clients have authorized this entity and taking into account the scope of the employee's permissions (to view and/or issue invoices).

Thanks to this mechanism, granting and functioning of permissions to view and issue invoices within the entity itself are not linked to permissions to handle client invoices. This gives entities better possibilities for profiling employee permissions than the previously functioning inheritance mechanism in KSeF. It was based on granting employees permissions to view and issue invoices within the entity, and if the entity had appropriate permissions from clients, these permissions automatically passed to employees (were inherited). As a result – an employee could only serve clients when they simultaneously had the right to view and/or issue entity invoices. And this was often an excessive permission, which could cause problems in organizations.

Additionally, the system introduced a new type of permission and new login capabilities, which enables handling of self-billing by EU entities. It is now possible to log in in a context defined by a Polish entity (identified by NIP) and an EU country entity identified by the VAT number of the EU country. In such a defined context, it is possible for authenticated representatives of the indicated EU entity to issue invoices in self-billing mode on behalf of the indicated Polish entity.

Within the API definition, all permissions have been organized into logical groups corresponding to individual functional areas of the system.

## API call limits (rate limiting) ##
In KSeF API version 2.0, a precise and predictable call limit mechanism (rate limits) has been introduced, which replaces the previous solutions known from version 1.0.
Each endpoint in the system is subject to a limit on the number of requests in given time intervals: per second, minute, hour.

The ranges and values of limits are:
* publicly available: [API limits](limity/limity-api.md),  
* differentiated depending on the environment (test environment has less restrictive limits than production),  
* adapted to the nature of operations:  
  * for protected endpoints – limits are applied per context and IP address,  
  * for open endpoints – limits are applied per IP address.

The new limit model has been designed so as not to restrict typical testing of applications integrating with the system.
This solution provides greater transparency, predictability, and better system resilience, both in test and production environments.

## Auxiliary API for generating test data (test environment)

In the KSeF API 2.0 test environment, a dedicated **auxiliary API for generating test data** will be made available, enabling quick creation of companies, organizational structures, and contexts necessary for conducting integration tests.

Thanks to this solution, it will be possible, among others:

* **simulate the establishment of a new business entity**,

* **simulate granting permissions by ZAW-FA**,

* **create units within the JST structure**,

* create tax **VAT groups** (GVAT) along with related entities,

* **define enforcement bodies** **and bailiffs**.

Normally, the process of registering companies and granting permissions for real entities in the production environment requires formal actions (e.g., visits to the tax office). In the test environment, such data does not exist. Therefore, the **auxiliary API is an essential tool**, enabling integrators to independently create test entities on which they can freely implement and verify complete scenarios of their application operation.
