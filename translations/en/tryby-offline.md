---
original: tryby-offline.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [tryby-offline.md](https://github.com/CIRFMF/ksef-docs/blob/main/tryby-offline.md)

## Offline modes
10.07.2025

## Introduction

The KSeF system provides two basic invoice issuing modes:
* ```online``` mode - invoice issued and sent in real time to the KSeF system,
* ```offline``` mode - invoice issued and sent to KSeF at a later date, as specified by law.

In offline mode, invoices are issued electronically in accordance with the applicable FA(3) structure template. The most important technical aspects:
* When sending an invoice – both in interactive and batch mode – the parameter `offlineMode: true` must be set.
* For invoices sent as online (offlineMode: false), the KSeF system may automatically assign them offline mode - based on comparison of the issue date with the receipt date. Mechanism details: [Automatic determination of offline sending mode](offline/automatyczne-okreslanie-trybu-offline.md).
* The KSeF system accepts exclusively the value contained in the ```P_1``` field of the e-invoice structure as the issue date.
* The invoice receipt date is the date of KSeF number assignment or, in case of sharing outside KSeF, the date of actual receipt.
* After issuing an invoice in offline mode, the client application should generate two [QR codes](kody-qr.md) for invoice visualization:
  * **CODE I** – enables invoice verification in the KSeF system,  
  * **CODE II** – confirms issuer identity.  
* A corrective invoice is sent only after the original document has been assigned a KSeF number.
* If a sent offline invoice is rejected for technical reasons, it is possible to use the [technical correction](/offline/korekta-techniczna.md) mechanism.


### Overview of invoice issuing modes in KSeF – offline24, offline and emergency

| Mode          | Responsibility side | Launch circumstances                                              | Deadline for sending to KSeF                                                               | Legal basis                             |
| ------------- | ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| **offline24** | client                   | No restrictions (taxpayer's discretion)                          | by the next business day after the issue date                                             | art. 106nda VAT Act (KSeF 2.0 project) |
| **offline**   | KSeF system              | System unavailability (announced in BIP and interface software) | by the next business day after the end of unavailability                                    | art. 106nh VAT Act (from 1 II 2026)      |
| **emergency**  | KSeF system              | KSeF failure (message in MF BIP and interface software)      | up to 7 business days from the end of failure (with the next message the counter starts over) | art. 106nf VAT Act (from 1 II 2026)      |

### Deadline for sending invoice to KSeF for subsequent events
In offline24 and offline modes, if a KSeF failure is announced during the expected period for sending invoices (message in MF BIP or interface software), the sending deadline is moved and counted from the day the last announced failure ends, no longer than 7 business days.

In emergency mode, if another failure message appears during the seven-day period for sending invoices, the deadline counter resets and runs from the day this subsequent failure ends.

Announcement of a total failure during any of the above modes results in the removal of the obligation to send invoices to KSeF.

#### Example: offline24 mode with announced KSeF failure
1. 2025-07-08 (Wednesday)
    * Taxpayer generates invoice in offline24 mode (offlineMode = true).
    * Deadline for sending to KSeF is set to 2025-07-09 (next business day).
2. 2025-07-09 (Thursday)
    * Ministry of Finance publishes communication about KSeF failure (BIP and API interface).
    * According to the rule: the original deadline is moved, and the new one is counted from the day the failure ends.
3. 2025-07-12 (Saturday)
    * Failure is removed – system available again.
    * A period of 7 business days begins for sending the overdue invoice.
4. 2025-07-22 (Tuesday)
    * The 7 business day deadline from the end of failure expires.
    * The application has until this date to send the invoice to KSeF with offlineMode = true set.


### Total failure mode
In case of announcement of total failure (social media: TV, radio, press, Internet):
* Invoice can be issued in paper or electronic form, without the obligation to use the FA(3) template.
* There is no obligation to send the invoice to KSeF after the failure ends.
* Transfer to the buyer takes place through any channel (in person, email, other).
* The issue date is always the actual date indicated on the invoice and the receipt date is the date of actual receipt of the purchase invoice.
* Invoices from this mode are not marked with QR codes.
* A corrective invoice during an ongoing KSeF failure is issued analogously – outside KSeF, with the actual date.

## Related documents
- [Technical correction of offline invoice](offline/korekta-techniczna.md)
- [QR codes](kody-qr.md)
