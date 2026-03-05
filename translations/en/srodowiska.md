---
original: srodowiska.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [srodowiska.md](https://github.com/CIRFMF/ksef-docs/blob/main/srodowiska.md)

## KSeF API 2.0 Environments 
15.12.2025

Below is a summary of the public environments.

| Abbr. | Environment                       | Description                                                                 | API Documentation                         | Allowed Formats                         |
|-------|----------------------------------|-----------------------------------|----------------------------------|----------------------------------------------|
| **TEST**  | Test <br/> (Release Candidate)        | Environment for testing integration with KSeF API 2.0, contains RC versions. | https://api-test.ksef.mf.gov.pl/docs/v2   | FA(2), FA(3), FA_PEF (3), FA_KOR_PEF (3)     |
| **DEMO**  | Pre-production (Demo)    | Environment matching the production configuration, intended for final integration validation under conditions close to production. | https://api-demo.ksef.mf.gov.pl/docs/v2   | FA(3), FA_PEF (3), FA_KOR_PEF (3)            |
| **PRD** | Production                        | Environment for issuing and receiving invoices with full legal force, with guaranteed SLA and actual production data.                           | https://api.ksef.mf.gov.pl/docs/v2             | FA(3), FA_PEF (3), FA_KOR_PEF (3)            |



> <font color="red">Warning:</font> Test environments (TE/DEMO) are intended solely for testing integration with the KSeF API. Do not submit **production invoices** or real entity data to them.

In the test environment `TE`, authentication using self-signed certificates is permitted, which in practice means that many integrators can [authenticate](uwierzytelnianie.md#proces-uwierzytelniania) in the context of the same company.
For this reason, data entered in the `TE` environment is not isolated and may be shared between integrators.
Use random NIP identifiers for testing, avoiding any real data.

### Maintenance Work on Test Environments
Due to the planned, systematic development of the National e-Invoice System (KSeF 2.0), **from October 1, 2025**, periodic maintenance work may be carried out on the System's test environments.

This work will take place between **4:00 PM and 6:00 PM**. During this time, temporary difficulties accessing the test environments may occur.

After maintenance is completed, only **changes affecting integration** will be published in the [changelog](api-changelog.md) — for example, changes in API behavior, contract modifications, XSD schema changes, limits, etc. Changes that do not affect the API and are invisible from an integration perspective — such as internal quality, performance, or security fixes — **may not be communicated** or will be presented in summary form.
