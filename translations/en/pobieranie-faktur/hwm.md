---
original: pobieranie-faktur/hwm.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [pobieranie-faktur/hwm.md](https://github.com/CIRFMF/ksef-docs/blob/main/pobieranie-faktur/hwm.md)

# High Water Mark (HWM)
25.11.2025

The High Water Mark (HWM) mechanism describes how KSeF manages data completeness over time for the `PermanentStorage` date.

At any given moment, the system knows a point in time (`HWM`) up to which it has certainty that all invoices have been saved and no new documents will appear with a `PermanentStorage` date earlier than or equal to this moment.

![HWM](hwm.png)

- For time ≤ `HWM` - all invoices with `PermanentStorage` date in this range have already been permanently saved in KSeF.
The system guarantees that in the future no new invoice will appear with `PermanentStorage` date ≤ `HWM`.
- In the range (`HWM`, `Now`):
    - some invoices are already visible and can be returned in a query,
    - due to the asynchronous and multi-threaded nature of the saving process, new invoices may still appear in this range, i.e., with `PermanentStorage` date falling within the range (`HWM`, `Now`].

Conclusion:
- everything that is ≤ `HWM` can be treated as a **closed** and **complete** set,
- everything that is > `HWM` is **potentially incomplete** and requires careful handling during synchronization.

## Scenario 1 - synchronization "only to HWM"

![HWM-1](hwm-1.png)

The system retrieves invoices with each query **from the "last known point" only up to the current `HWM` value**. The new `HWM` value becomes the beginning of the next range.

Advantages:
- data up to `HWM` is definitive - no need to recheck the same range,
- the number of duplicates between consecutive retrievals is minimal.

Consequences:
- some of the newest invoices from the range `(HWM, Now]` are not visible in the local system - they will appear only after `HWM` moves forward in the next cycle.

This scenario is recommended for incremental, automatic data synchronization where optimization of traffic and minimization of duplicates is more important than immediate availability of the newest invoices.

## Scenario 2 - synchronization "to Now"

![HWM-2](hwm-2.png)

The system integrating with KSeF performs cyclical, incremental queries **from the last starting point all the way to `Now`** and saves all returned invoices, including those from the range `(HWM, Now]`.

Since data in this range may be incomplete, **the next query repeats part of the range** - at least from the previous `HWM` to the new `Now`. Deduplication on the local system side is necessary (e.g., by KSeF number).

Advantages:
- the local system (and user) sees the newest invoices as quickly as possible, without waiting for `HWM` to "catch up" to them.

Consequences:
- the range `(HWM, Now]` must be checked again in the next query,
- duplicates will appear that need to be removed on the local system side.

The same mechanism can also be used **ad hoc**, when a user manually requests data refresh - the system then retrieves "here and now" the newest available invoices from the last known date up to `Now`.

## Related documents

- [Incremental invoice retrieval](przyrostowe-pobieranie-faktur.md)
