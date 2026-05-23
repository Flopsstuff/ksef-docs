---
original: faktury/weryfikacja-faktury.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: d92d285
last_translated: 2026-05-23
---

> **Translation.** Original: [faktury/weryfikacja-faktury.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/weryfikacja-faktury.md)

# Invoice Verification
09.04.2026

An invoice sent to the KSeF system undergoes a series of technical and semantic controls. Verification includes the following criteria:

## XML Verification
The invoice must meet all of the following requirements:

- it must be prepared as a valid XML document, compliant with XML 1.0 rules,
- it must be encoded in UTF-8 without BOM signature (first 3 bytes 0xEF 0xBB 0xBF),
- it must be compliant with the declared schema provided when opening the session,
- it may contain an XML prolog, however if present, it must not specify any encoding other than UTF-8,
- it must not contain XML processing instructions,
- it must not contain discouraged Unicode characters as defined in the [XML W3C](https://www.w3.org/TR/xml/#charsets) specification, i.e. characters from the following ranges:  
  [#x7F-#x84], [#x86-#x9F], [#xFDD0-#xFDEF],   
  [#x1FFFE-#x1FFFF], [#x2FFFE-#x2FFFF], [#x3FFFE-#x3FFFF],  
  [#x4FFFE-#x4FFFF], [#x5FFFE-#x5FFFF], [#x6FFFE-#x6FFFF],  
  [#x7FFFE-#x7FFFF], [#x8FFFE-#x8FFFF], [#x9FFFE-#x9FFFF],  
  [#xAFFFE-#xAFFFF], [#xBFFFE-#xBFFFF], [#xCFFFE-#xCFFFF],  
  [#xDFFFE-#xDFFFF], [#xEFFFE-#xEFFFF], [#xFFFFE-#xFFFFF],  
  [#x10FFFE-#x10FFFF].

Failure to meet any of the above requirements will result in the invoice being rejected.

## Invoice Uniqueness
- KSeF detects invoice duplicates globally, based on data stored in the system. The duplicate identification criterion consists of a combination of:
  1. Seller's NIP (`Podmiot1:NIP`)
  2. Invoice type (`RodzajFaktury`)
  3. Invoice number (`P_2`)
- In case of a duplicate, error code 440 ("Invoice duplicate") is returned.
- Invoice uniqueness is maintained in KSeF for a period of 10 full years, counted from the end of the calendar year in which the invoice was issued.
- The uniqueness criterion always refers to the seller (Podmiot1:NIP). In cases where different units issue invoices on behalf of the same entity (e.g., branches, organizational units of local government entities, other authorized entities), they must agree on numbering rules to avoid duplicates.

## Date Validation
The invoice issue date (`P_1`) cannot be later than the date of document acceptance into the KSeF system.

## NIP Number Validation
  - Verification of NIP checksum for: `Podmiot1`, `Podmiot2`, `Podmiot3` and `PodmiotUpowazniony` (if present).
  - Applies only to the production environment.

## NIP Number Validation in Internal Identifier
  - Verification of NIP checksum in the internal identifier (`InternalId`) for `Podmiot3` - if this identifier is present.
  - Applies only to the production environment.

## File Size
- Maximum invoice size without attachments: **1 MB \*** (1,000,000 bytes).
- Maximum invoice size with attachments: **3 MB \*** (3,000,000 bytes).

## Quantity Limitations
- Maximum number of invoices in one session (both interactive and batch) is 10,000 *.
- Within batch submission, you can send a maximum of 50 ZIP files; the size of each file before encryption cannot exceed 100 MB (100,000,000 bytes), and the total size of the ZIP package - 5 GB (5,000,000,000 bytes).

## Proper Encryption
- The invoice should be encrypted using the AES-256-CBC algorithm (256-bit symmetric key, 128-bit IV, with PKCS#7 padding).
- Symmetric key encrypted using the RSAES-OAEP algorithm (SHA-256/MGF1).

## Invoice Metadata Compliance in Interactive Session
- Calculation and verification of invoice hash along with file size.
- Calculation and verification of encrypted invoice hash along with file size.

## Attachment Limitations
- Sending invoices with attachments is allowed only in batch mode.  
**Exception:** When sending a [technical correction of an offline invoice](../offline/korekta-techniczna.md), the use of an interactive session is permitted.
- The ability to send invoices with attachments requires prior registration of this option in the `e-Tax Office` service.

## Authorization Requirements
Sending an invoice to KSeF requires having appropriate permissions to issue it in the context of a given entity.

\* **Note:** If the available [limits](../limity/limity.md) are insufficient for your organization's business scenarios, please contact KSeF support for individual analysis and selection of an appropriate solution.
