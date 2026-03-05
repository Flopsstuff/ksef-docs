---
original: pobieranie-faktur/przyrostowe-pobieranie-faktur.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [pobieranie-faktur/przyrostowe-pobieranie-faktur.md](https://github.com/CIRFMF/ksef-docs/blob/main/pobieranie-faktur/przyrostowe-pobieranie-faktur.md)

# Incremental Invoice Retrieval
21.11.2025

## Introduction

Incremental invoice retrieval, based on package export (POST [`/invoices/exports`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post)), is the recommended synchronization mechanism between the central KSeF repository and local databases of external systems.

The **[High Water Mark (HWM)](hwm.md)** mechanism plays a key role here - a stable point in time up to which the system guarantees data completeness.

## Solution Architecture

Incremental retrieval is based on three key components:

1. **Time window synchronization** - using adjacent time windows with HWM consideration to ensure continuity and no omissions
2. **API limits handling** - controlling call rate, handling HTTP 429 and Retry-After
3. **Deduplication** - eliminating duplicates based on metadata from `_metadata.json` files

Base method: POST [`/invoices/exports`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post) initiates an asynchronous export. After processing completion, the operation status provides unique URLs for downloading package parts.

## Time Window Synchronization (Windowing)

### Concept

Invoice retrieval occurs in adjacent time windows using the `PermanentStorageHwmDate` date. To enable the HWM mechanism, set the parameter `restrictToPermanentStorageHwmDate = true` in the export request. Each subsequent window starts exactly at the moment the previous one ended, considering HWM (except for the situation described in the [High Water Mark (HWM) Mechanism and Truncated Package Handling](#high-water-mark-hwm-mechanism-and-truncated-package-handling-istruncated) section). By "end moment" we understand:

- the `dateRange.to` value when provided, or
- `PermanentStorageHwmDate` when `dateRange.to` is omitted.

This approach ensures range continuity and eliminates the risk of missing any invoice. Invoices should be retrieved separately for each subject type (`Subject 1`, `Subject 2`, `Subject 3`, `Authorized Subject`) appearing in the document. Iteration through subjects ensures data completeness - a company may appear in different roles on invoices.

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
// Dictionary to track continuation point for each SubjectType
Dictionary<InvoiceSubjectType, DateTime?> continuationPoints = new();
IReadOnlyList<(DateTime From, DateTime To)> windows = BuildIncrementalWindows(batchCreationStart, batchCreationCompleted);

// Creating export plan - tuples (time window, subject type)
IEnumerable<InvoiceSubjectType> subjectTypes = Enum.GetValues<InvoiceSubjectType>().Where(x => x != InvoiceSubjectType.SubjectAuthorized);
IOrderedEnumerable<ExportTask> exportTasks = windows
    .SelectMany(window => subjectTypes, (window, subjectType) => new ExportTask(window.From, window.To, subjectType))
    .OrderBy(task => task.From)
    .ThenBy(task => task.SubjectType);


foreach (ExportTask task in exportTasks)
{
    DateTime effectiveFrom = GetEffectiveStartDate(continuationPoints, task.SubjectType, task.From);

    OperationResponse? exportResponse = await InitiateInvoiceExportAsync(effectiveFrom, task.To, task.SubjectType);

    // Further export handling...
```

Example in ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
Map<InvoiceQuerySubjectType, OffsetDateTime> continuationPoints = new HashMap<>();

List<TimeWindows> timeWindows = buildIncrementalWindows(batchCreationStart, batchCreationCompleted);
List<InvoiceQuerySubjectType> subjectTypes = Arrays.stream(InvoiceQuerySubjectType.values())
        .filter(x -> x != InvoiceQuerySubjectType.SUBJECTAUTHORIZED)
        .toList();

List<ExportTask> exportTasks = timeWindows.stream()
        .flatMap(window -> subjectTypes.stream()
                .map(subjectType -> new ExportTask(window.getFrom(), window.getTo(), subjectType)))
        .sorted(Comparator.comparing(ExportTask::getFrom)
                .thenComparing(ExportTask::getSubjectType))
        .toList();
exportTasks.forEach(task -> {
        EncryptionData encryptionData = defaultCryptographyService.getEncryptionData();
        OffsetDateTime effectiveFrom = getEffectiveStartDate(continuationPoints, task.getSubjectType(), task.getFrom());
        String operationReferenceNumber = initiateInvoiceExportAsync(effectiveFrom, task.getTo(),
            task.getSubjectType(), accessToken, encryptionData.encryptionInfo());

// Further export handling...
```

### Recommended Window Sizes

- **Frequency and Limits**  
    POST `/invoice/exports` requires specifying subject type (`Subject 1`, `Subject 2`, `Subject 3`, `Authorized Subject`). According to [API limits](../limity/limity-api.md), a maximum of 20 exports per hour can be initiated; the schedule should divide this pool among selected subject types.
- **Schedule Strategy**  
    In continuous synchronization mode, 4 exports/h per subject type can be adopted. In practice, `Subject 3` and `Authorized Subject` roles typically occur less frequently and can be run sporadically, e.g., once per day in a night window.
- **Minimum Interval**  
    The cyclic interval should not be shorter than 15 minutes for each subject type (according to API limits recommendations).
- **Window Size**
    In continuous synchronization scenario, it's recommended to call export without specifying an end date (`DateRange.To` omitted). In such case, the KSeF system prepares the largest possible, coherent package within algorithm limits (number of invoices, data size after compression), which reduces the number of calls and load on both sides. When `IsTruncated = true`, the next call should start from `LastPermanentStorageDate`, when `IsTruncated = false`, the next call should start from the returned `PermanentStorageHwmDate`.
- **No Overlap**
    Ranges must be adjacent; the end of one window is the beginning of the next.
- **Control Point**
    The continuation point determined by HWM - `PermanentStorageHwmDate` or `LastPermanentStorageDate` for truncated packages constitutes the beginning of the next window.

>The invoice receipt date is the KSeF number assignment date. The number is assigned during invoice processing on the KSeF side and does not depend on the moment of download to the external system.

## API Limits Handling

### Limits by Endpoint Type

All endpoints related to invoice retrieval are subject to strict API limits defined in the [API Limits](../limity/limity-api.md) documentation. These limits are binding and must be respected by every incremental retrieval implementation.

In case of limit violations, the system returns HTTP `429` (Too Many Requests) status code along with a `Retry-After` header indicating the wait time before the next attempt.

## Invoice Export Initialization

### Key Importance of PermanentStorage Date

For incremental invoice retrieval, it is **necessary** to use `PermanentStorage` date type, which ensures data reliability. It indicates the moment of permanent record materialization, is resistant to asynchronous delays in the data acceptance process, and allows safe determination of increment windows.
Thus, other date types (like `Issue` or `Invoicing`) may lead to unpredictable behaviors in incremental synchronization.

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
EncryptionData exportEncryption = CryptographyService.GetEncryptionData();

InvoiceQueryFilters filters = new()
{
    SubjectType = subjectType,
    DateRange = new DateRange
    {
        DateType = DateType.PermanentStorage,
        From = windowFromUtc,
        To = windowToUtc,
        RestrictToPermanentStorageHwmDate = true
    }
};

InvoiceExportRequest request = new()
{
    Filters = filters,
    Encryption = exportEncryption.EncryptionInfo
};

OperationResponse response = awat KsefClient.ExportInvoicesAsync(request, _accessToken, ct, includeMetadata: true);
```

Example in ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
EncryptionData encryptionData = defaultCryptographyService.getEncryptionData();
InvoiceExportFilters filters = new InvoiceExportFilters();
filters.setSubjectType(subjectType);
filters.setDateRange(new InvoiceQueryDateRange(
        InvoiceQueryDateType.PERMANENTSTORAGE, windowFrom, windowTo)
);

InvoiceExportRequest request = new InvoiceExportRequest();
request.setFilters(filters);
request.setEncryption(encryptionInfo);

InitAsyncInvoicesQueryResponse response = ksefClient.initAsyncQueryInvoice(request, accessToken);
```

## Package Download and Processing

After export completion, the invoice package is available for download as an encrypted ZIP archive divided into parts. The download and processing process includes:

1. **Part Download** - each part downloaded separately from URLs returned in operation status.
2. **AES-256 Decryption** - each part is decrypted using the key and IV generated during export initialization.
3. **Package Assembly** - decrypted parts combined into a single data stream.
4. **ZIP Extraction** - archive contains invoice XML files and `_metadata.json` file.

### _metadata.json File

The content of the _metadata.json file is a JSON object with the `invoices` property (an array of `InvoiceMetadata` type elements, as returned by POST `/invoices/query/metadata`).
This file is crucial for the deduplication mechanism as it contains KSeF numbers of all invoices in the package.

**Metadata Inclusion (until 27.10.2025)**  
To include the `_metadata.json` file, add a header to the export request:

```http
X-KSeF-Feature: include-metadata
```

**From 27.10.2025** the export package will always contain the `_metadata.json` file without the need to add the header.

Example in ```C#```:

[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

[KSeF.Client.Tests.Utils\BatchSessionUtils.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Utils/BatchSessionUtils.cs)

```csharp
List<InvoiceSummary> metadataSummaries = new();
Dictionary<string, string> invoiceXmlFiles = new(StringComparer.OrdinalIgnoreCase);

// Download, decrypt and combine all parts into single stream
using MemoryStream decryptedArchiveStream = await BatchUtils.DownloadAndDecryptPackagePartsAsync(
    package.Parts, 
    encryptionData, 
    CryptographyService, 
    cancellationToken: CancellationToken)
    .ConfigureAwait(false);

// ZIP extraction
Dictionary<string, string> unzippedFiles = await BatchUtils.UnzipAsync(decryptedArchiveStream, CancellationToken).ConfigureAwait(false);

foreach ((string fileName, string content) in unzippedFiles)
{
    if (fileName.Equals(MetadataEntryName, StringComparison.OrdinalIgnoreCase))
    {
        InvoicePackageMetadata? metadata = JsonSerializer.Deserialize<InvoicePackageMetadata>(content, MetadataSerializerOptions);
        if (metadata?.Invoices != null)
        {
            metadataSummaries.AddRange(metadata.Invoices);
        }
    }
    else if (fileName.EndsWith(XmlFileExtension, StringComparison.OrdinalIgnoreCase))
    {
        invoiceXmlFiles[fileName] = content;
    }
}
```

Example in ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
 List<InvoicePackagePart> parts = invoiceExportStatus.getPackageParts().getParts();
byte[] mergedZip = FilesUtil.mergeZipParts(
        encryptionData,
        parts,
        part -> ksefClient.downloadPackagePart(part),
        (encryptedPackagePart, key, iv) -> defaultCryptographyService.decryptBytesWithAes256(encryptedPackagePart, key, iv)
);
Map<String, String> downloadedFiles = FilesUtil.unzip(mergedZip);

String metadataJson = downloadedFiles.keySet()
        .stream()
        .filter(fileName -> fileName.endsWith(".json"))
        .findFirst()
        .map(downloadedFiles::get)
        .orElse(null);
InvoicePackageMetadata invoicePackageMetadata = objectMapper.readValue(metadataJson, InvoicePackageMetadata.class);
```

## High Water Mark (HWM) Mechanism and Truncated Package Handling (IsTruncated)

### HWM Concept

High Water Mark (HWM) is a mechanism ensuring optimal management of starting points for subsequent exports in incremental invoice retrieval. HWM consists of two complementary components:

- **`PermanentStorageHwmDate`** - stable upper boundary of data included in the package, representing the moment up to which the system guarantees data completeness.
- **`LastPermanentStorageDate`** - date of the last invoice in the package, used when the package was truncated (`IsTruncated = true`).

#### HWM Mechanism Benefits

- **Duplicate Minimization** - HWM significantly reduces the number of duplicates between consecutive packages
- **Performance Optimization** - reduces load on the deduplication mechanism  
- **Completeness Preservation** - ensures no invoices are skipped
- **Synchronization Stability** - provides reliable continuation points for long-running processes

### Package Continuation Strategy

The `IsTruncated = true` flag is set when algorithm limits (number of invoices or data size after compression) are reached during package building. In such case, both HWM properties are available in the operation status.
The HWM mechanism uses the following priority hierarchy for determining the continuation point. To maintain retrieval continuity and not miss any document, the next export call should start from:

1. **Truncated package** (`IsTruncated = true`) - next call starts from `LastPermanentStorageDate`
2. **Stable HWM** - using `PermanentStorageHwmDate` as starting point for the next window

- the next window starts at the same point where the previous one ended (adjacency); any duplicates will be removed in the deduplication stage based on KSeF numbers from _metadata.json.
Below is an example of maintaining the continuation point:

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
private static void UpdateContinuationPointIfNeeded(
    Dictionary<InvoiceSubjectType, DateTime?> continuationPoints,
    InvoiceSubjectType subjectType,
    InvoiceExportPackage package)
{
    // Priority 1: Truncated package - LastPermanentStorageDate
    if (package.IsTruncated && package.LastPermanentStorageDate.HasValue)
    {
        continuationPoints[subjectType] = package.LastPermanentStorageDate.Value.UtcDateTime;
    }
    // Priority 2: Stable HWM as next window boundary
    else if (package.PermanentStorageHwmDate.HasValue)
    {
        continuationPoints[subjectType] = package.PermanentStorageHwmDate.Value.UtcDateTime;
    }
    else
    {
        // Range fully processed - remove continuation point
        continuationPoints.Remove(subjectType);
    }
}
```

Example in ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
private void updateContinuationPointIfNeeded(Map<InvoiceQuerySubjectType, OffsetDateTime> continuationPoints,
                                                 InvoiceQuerySubjectType subjectType,
                                                 InvoiceExportPackage invoiceExportPackage) {
    if (Boolean.TRUE.equals(invoiceExportPackage.getIsTruncated()) && Objects.nonNull(invoiceExportPackage.getLastPermanentStorageDate())) {
        continuationPoints.put(subjectType, invoiceExportPackage.getLastPermanentStorageDate());
    } else {
        continuationPoints.remove(subjectType);
    }
}
```

## Invoice Deduplication

### Deduplication Strategy

Deduplication is performed based on KSeF numbers contained in the `_metadata.json` file:

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\Invoice\IncrementalInvoiceRetrievalE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/IncrementalInvoiceRetrievalE2ETests.cs)

```csharp
Dictionary<string, InvoiceSummary> uniqueInvoices = new(StringComparer.OrdinalIgnoreCase);
bool hasDuplicates = false;

// Processing metadata from package - adding unique invoices and detecting duplicates
hasDuplicates = packageResult.MetadataSummaries
    .DistinctBy(s => s.KsefNumber, StringComparer.OrdinalIgnoreCase)
    .Any(summary => !uniqueInvoices.TryAdd(summary.KsefNumber, summary));
```

Example in ```java```:
[IncrementalInvoiceRetrieveIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IncrementalInvoiceRetrieveIntegrationTest.java)

```java
hasDuplicates.set(packageProcessingResult.getInvoiceMetadataList()
        .stream()
        .anyMatch(summary -> uniqueInvoices.containsKey(summary.getKsefNumber())));

packageProcessingResult.getInvoiceMetadataList()
        .stream()
        .distinct()
        .forEach(summary -> uniqueInvoices.put(summary.getKsefNumber(), summary));
```

## Related Documents

- [High Water Mark](hwm.md)
- [API Limits](../limity/limity-api.md)
- [Invoice Retrieval](pobieranie-faktur.md)
