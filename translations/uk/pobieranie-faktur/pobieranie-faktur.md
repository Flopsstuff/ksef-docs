---
original: pobieranie-faktur/pobieranie-faktur.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [pobieranie-faktur/pobieranie-faktur.md](https://github.com/CIRFMF/ksef-docs/blob/main/pobieranie-faktur/pobieranie-faktur.md)

## Завантаження рахунків-фактур
### Отримання рахунків-фактур за номером KSeF
21.08.2025

Повертає рахунок-фактуру з вказаним номером KSeF.

GET [/invoices/ksef/\{ksefNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1ksef~1%7BksefNumber%7D/get)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Invoice\InvoiceE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/InvoiceE2ETests.cs)

```csharp
string invoice = await ksefClient.GetInvoiceAsync(ksefReferenceNumber, accessToken, cancellationToken);
```

Приклад мовою Java:

[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
byte[] invoice = ksefClient.getInvoice(ksefNumber, accessToken);
```

### Отримання списку метаданих рахунків-фактур
Повертає список метаданих рахунків-фактур, що відповідають заданим критеріям пошуку.

**Файл _metadata.json у пакеті експорту**  
У пакеті експорту знаходиться файл `_metadata.json`, що містить масив об'єктів `InvoiceMetadata` (модель, що повертається POST `/invoices/query/metadata` - "Отримання метаданих рахунків-фактур").

POST [/invoices/query/metadata](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1query~1metadata/post)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Invoice\InvoiceE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/InvoiceE2ETests.cs)

```csharp
InvoiceQueryFilters invoiceQueryFilters = new InvoiceQueryFilters
{
    SubjectType = InvoiceSubjectType.Subject1,
    DateRange = new DateRange
    {
        From = DateTime.UtcNow.AddDays(-30),
        To = DateTime.UtcNow,
        DateType = DateType.Issue
    }
};

PagedInvoiceResponse pagedInvoicesResponse = await ksefClient.QueryInvoiceMetadataAsync(
    invoiceQueryFilters, 
    accessToken, 
    pageOffset: 0, 
    pageSize: 10, 
    cancellationToken);
```

Приклад мовою Java:

[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
InvoiceQueryFilters request = new InvoiceQueryFiltersBuilder()
        .withSubjectType(InvoiceQuerySubjectType.SUBJECT1)
        .withDateRange(
                new InvoiceQueryDateRange(InvoiceQueryDateType.INVOICING, OffsetDateTime.now().minusYears(1),
                        OffsetDateTime.now()))
        .build();

QueryInvoiceMetadataResponse response = ksefClient.queryInvoiceMetadata(pageOffset, pageSize, SortOrder.ASC, request, accessToken);


```

### Ініціалізує асинхронний запит на завантаження рахунків-фактур

Розпочинає асинхронний процес пошуку рахунків-фактур у системі KSeF на основі переданих фільтрів. Необхідно передати інформацію про шифрування в полі `encryption`, яка використовується для шифрування згенерованих пакетів з рахунками-фактурами.

POST [/invoices/exports](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports/post)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Invoice\InvoiceE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/InvoiceE2ETests.cs)

```csharp
EncryptionData encryptionData = CryptographyService.GetEncryptionData();

InvoiceQueryFilters query = new InvoiceQueryFilters
{
    DateRange = new DateRange
    {
        From = DateTime.Now.AddDays(-1),
        To = DateTime.Now.AddDays(1),
        DateType = DateType.Invoicing
    },
    SubjectType = InvoiceSubjectType.Subject1
};

InvoiceExportRequest invoiceExportRequest = new InvoiceExportRequest
{
    Encryption = encryptionData.EncryptionInfo,
    Filters = query
};

OperationResponse invoicesForSellerResponse = await KsefClient.ExportInvoicesAsync(
    invoiceExportRequest,
    _accessToken,
    CancellationToken);
```

Доступні значення `DateType` та `SubjectType` описані [тут](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1query~1metadata/post).

Рахунки-фактури в пакеті сортуються у зростаючому порядку за типом дати, вказаним в `DateRange` під час ініціалізації експорту.

Приклад мовою Java:

[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
InvoiceExportFilters filters = new InvoicesAsyncQueryFiltersBuilder()
        .withSubjectType(InvoiceQuerySubjectType.SUBJECT1)
        .withDateRange(
                new InvoiceQueryDateRange(InvoiceQueryDateType.INVOICING, OffsetDateTime.now().minusDays(10), OffsetDateTime.now().plusDays(10)))
        .build();

InvoiceExportRequest request = new InvoiceExportRequest(
        new EncryptionInfo(encryptionData.encryptionInfo().getEncryptedSymmetricKey(),
                encryptionData.encryptionInfo().getInitializationVector()), filters);

InitAsyncInvoicesQueryResponse response = ksefClient.initAsyncQueryInvoice(request, accessToken);

```

### Перевіряє статус асинхронного запиту на завантаження рахунків-фактур

Отримує статус раніше ініціалізованого асинхронного запиту на основі ідентифікатора операції. Дозволяє відстежувати прогрес обробки запиту та завантажувати готові пакети з результатами, якщо вони вже доступні.

GET [/invoices/exports/{referenceNumber}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Pobieranie-faktur/paths/~1invoices~1exports~1%7BreferenceNumber%7D/get)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Invoice\InvoiceE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Invoice/InvoiceE2ETests.cs)

```csharp
InvoiceExportStatusResponse exportStatus = await KsefClient.GetInvoiceExportStatusAsync(
    exportInvoicesResponse.ReferenceNumber,
    accessToken);
```

Приклад мовою Java:

[QueryInvoiceIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QueryInvoiceIntegrationTest.java)

```java
InvoiceExportStatus response = ksefClient.checkStatusAsyncQueryInvoice(referenceNumber, accessToken);

```

## Пов'язані документи

- [Поступове завантаження рахунків-фактур](przyrostowe-pobieranie-faktur.md)
