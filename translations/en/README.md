---
original: README.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [README.md](https://github.com/CIRFMF/ksef-docs/blob/main/README.md)

# **KSeF 2.0 \- Guide for Integrators**
22.12.2025

This document is a compendium of knowledge for developers, analysts, and system integrators implementing integration with the National e-Invoice System (KSeF) version 2.0. The guide focuses on the technical and practical aspects of communicating with the KSeF system API.

##  Introduction to KSeF 2.0

The National e-Invoice System (KSeF) is a central IT system for issuing and retrieving structured invoices in electronic form.

## Table of Contents
The guide is divided into thematic sections corresponding to key functions and integration areas in the KSeF API:
* [Overview of Key Changes in KSeF 2.0](przeglad-kluczowych-zmian-ksef-api-2-0.md)
* [Changelog](api-changelog.md)
* Authentication
  * [Obtaining Access](uwierzytelnianie.md)
  * [Session Management](auth/sesje.md)
* [Permissions](uprawnienia.md)
* [KSeF Certificates](certyfikaty-KSeF.md)
* Offline Modes
  * [Offline Modes](tryby-offline.md)
  * [Technical Correction](offline/korekta-techniczna.md)
* [QR Codes](kody-qr.md)
* [Interactive Session](sesja-interaktywna.md)
* [Batch Session](sesja-wsadowa.md)
* Downloading Invoices
  * [Downloading Invoices](pobieranie-faktur/pobieranie-faktur.md)
  * [Incremental Invoice Download](pobieranie-faktur/przyrostowe-pobieranie-faktur.md)
* [KSeF Token Management](tokeny-ksef.md)
* [Limits](limity/limity.md)
* [Test Data](dane-testowe-scenariusze.md)

For each area, the following is provided:

* detailed description of operation,
* example calls in C# and Java,
* links to the [OpenAPI](https://api-test.ksef.mf.gov.pl/docs/v2) specification and reference library code.

The code examples presented in the guide were prepared based on the official open source libraries:
* [ksef-client-csharp](https://github.com/CIRFMF/ksef-client-csharp) – C# library
* [ksef-client-java](https://github.com/CIRFMF/ksef-client-java) – Java library

Both libraries are maintained and developed by the Ministry of Finance teams and are publicly available under open source terms. They provide full support for KSeF API 2.0 functionality, including handling of all endpoints, data models, and example call scenarios. Using these libraries significantly simplifies the integration process and minimizes the risk of misinterpreting API contracts.


## System Environments
A list of KSeF API 2.0 environments is described in the [KSeF API 2.0 Environments](srodowiska.md) document.
