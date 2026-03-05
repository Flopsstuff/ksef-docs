---
original: offline/automatyczne-okreslanie-trybu-offline.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [offline/automatyczne-okreslanie-trybu-offline.md](https://github.com/CIRFMF/ksef-docs/blob/main/offline/automatyczne-okreslanie-trybu-offline.md)

## Automatic offline mode determination
04.10.2025  

In the case of invoices sent as online (`offlineMode: false`), the KSeF system may assign them offline mode - based on comparison of the issue date with the processing acceptance date.

## Mechanism algorithm

For invoices sent as `offlineMode: false`, the system compares:
- **issue date** of the invoice (`issueDate`, e.g., `P_1` for invoice compliant with FA(3)),
- **acceptance date** of the invoice in the KSeF system for further processing (`invoicingDate`).

Rules:
- If the calendar day from `issueDate` is earlier than the calendar day from `invoicingDate` (comparison by date, not by time), the system automatically marks the invoice as **offline**, even if it was not declared as such.
- If the day of `issueDate` and the day of `invoicingDate` are the same, the invoice remains **online**.

The `invoicingDate` value depends on the transmission mode:
- **batch session** - `invoicingDate` is the session opening time (equal to `dateCreated` returned in session status - GET `/sessions/{referenceNumber}`),
- **interactive session** - `invoicingDate` is the invoice transmission time.

This means that if, for example, an invoice was issued on 2025-10-03 (`P_1`) and sent on 2025-10-04 at 00:00:01, despite offlineMode: false, it will be marked as an offline invoice.

## Examples
**Batch session** opened at 23:59:59 on October 3rd:
Even if the package is sent after midnight, invoices will remain online – because `invoicingDate` is October 3rd (session opening date).

**Interactive session** started at 23:59:59 on October 3rd, and invoices were sent after midnight:
If `P_1` = 2025-10-03, the system will mark them as offline – because the day of `P_1` is earlier than the transmission day.


## Related documents
- [Offline modes](../tryby-offline.md)
