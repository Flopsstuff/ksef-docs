---
original: limity/limity.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [limity/limity.md](https://github.com/CIRFMF/ksef-docs/blob/main/limity/limity.md)

# Limits
21.10.2025

## Introduction

The KSeF 2.0 system implements mechanisms that limit the number and size of API operations as well as parameters related to transmitted data. The purpose of these limits is to:
- protect system stability at large scale operations,
- counteract abuse and inefficient integrations,
- prevent abuse and potential cybersecurity threats,
- ensure equal access conditions for all users.

The limits have been designed with the possibility of flexible adaptation to the needs of specific entities requiring greater operation intensity.

## API Request Limits
The KSeF system limits the number of requests that can be sent in a short time to ensure stable system operation and equal access for all users.
More information can be found in [API Request Limits](limity-api.md).

## Context Limits

| Parameter                                                 | Default Value                         |
| --------------------------------------------------------- | ------------------------------------- |
| Maximum invoice size without attachment                   | 1 MB                                  |
| Maximum invoice size with attachment                      | 3 MB                                  |
| Maximum number of invoices in interactive/batch session  | 10,000                                |

## Authenticated Entity Limits

### Requests and Active Certificates

| Certificate Identifier                  | KSeF Certificate Requests | Active KSeF Certificates |
| --------------------------------------- | ------------------------- | ------------------------ |
| NIP                                     | 300                       | 100                      |
| PESEL                                   | 6                         | 2                        |
| Certificate fingerprint                 | 6                         | 2                        |

## Limit Adjustment

The KSeF system enables individual adjustment of selected technical limits for:
- API limits - e.g., increasing the number of requests for a selected endpoint,
- context - e.g., increasing the maximum invoice size,
- authenticating entity - e.g., increasing the limits of active KSeF certificates for an individual (PESEL).

On the **production environment**, limit increases are only possible based on a justified request, supported by real operational need.
The request is submitted via the [contact form](https://ksef.podatki.gov.pl/formularz/), along with a detailed description of the use case.

## Checking Individual Limits
The KSeF system provides endpoints allowing verification of current limit values for the current context or entity:

### Getting Limits for Current Context

GET [/limits/context](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1limits~1context/get)

Returns the values of applicable limits for interactive and batch sessions for the current context.

C# example:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)
```csharp
Client.Core.Models.TestData.SessionLimitsInCurrentContextResponse limitsForContext =
    await LimitsClient.GetLimitsForCurrentContextAsync(
        accessToken,
        CancellationToken);
```
Java example:

[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
GetContextLimitResponse response = ksefClient.getContextSessionLimit(accessToken);
```

### Getting Limits for Current Entity

GET [/limits/subject](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1limits~1subject/get)

Returns the applicable limits for certificates and certificate requests for the current authenticated entity.

C# example:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)
```csharp
Client.Core.Models.TestData.CertificatesLimitInCurrentSubjectResponse limitsForSubject =
        await LimitsClient.GetLimitsForCurrentSubjectAsync(
            accessToken,
            CancellationToken);
```

Java example:

[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
GetSubjectLimitResponse response = ksefClient.getSubjectCertificateLimit(accessToken);
```

## Modifying Limits on Test Environment

On the **test environment**, a set of methods is available that enable changing and restoring limits to default values.
These operations are only available for authenticated entities and do not affect the production environment.

### Changing Session Limits for Current Context

POST [/testdata/limits/context/session](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1context~1session/post)

C# example:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
Client.Core.Models.TestData.ChangeSessionLimitsInCurrentContextRequest newLimits =
    new()
    {
        OnlineSession = new Client.Core.Models.TestData.SessionLimits
        {
            MaxInvoices = newMaxInvoices,
            MaxInvoiceSizeInMB = newMaxInvoiceSizeInMB
            MaxInvoiceWithAttachmentSizeInMB = newMaxInvoiceWithAttachmentSizeInMB
        },

        BatchSession = new Client.Core.Models.TestData.SessionLimits
        {
            MaxInvoices = newBatchSessionMaxInvoices
            MaxInvoiceSizeInMB = newBatchSessionMaxInvoiceSizeInMB,
            MaxInvoiceWithAttachmentSizeInMB = newBatchSessionMaxInvoiceWithAttachmentSizeInMB,
        }
    };

await TestDataClient.ChangeSessionLimitsInCurrentContextAsync(
    newLimits,
    accessToken);
```

Java example:

[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
ChangeContextLimitRequest request = new ChangeContextLimitRequest();
OnlineSessionLimit onlineSessionLimit = new OnlineSessionLimit();
onlineSessionLimit.setMaxInvoiceSizeInMB(4);
onlineSessionLimit.setMaxInvoiceWithAttachmentSizeInMB(5);
onlineSessionLimit.setMaxInvoices(6);

BatchSessionLimit batchSessionLimit = new BatchSessionLimit();
batchSessionLimit.setMaxInvoiceSizeInMB(4);
batchSessionLimit.setMaxInvoiceWithAttachmentSizeInMB(5);
batchSessionLimit.setMaxInvoices(6);

request.setOnlineSession(onlineSessionLimit);
request.setBatchSession(batchSessionLimit);

ksefClient.changeContextLimitTest(request, accessToken);
```

### Restoring Session Limits for Context to Default Values

DELETE [/testdata/limits/context/session](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1context~1session/delete)

C# example:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
await TestDataClient.RestoreDefaultSessionLimitsInCurrentContextAsync(accessToken);
```

Java example:
[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
ksefClient.resetContextLimitTest(accessToken);
```

### Changing Certificate Limits for Current Entity

POST [/testdata/limits/subject/certificate](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1subject~1certificate/post)

C# example:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
Client.Core.Models.TestData.ChangeCertificatesLimitInCurrentSubjectRequest newCertificateLimitsForSubject = new()
{
    SubjectIdentifierType = Client.Core.Models.TestData.TestDataSubjectIdentifierType.Nip,
    Certificate = new Client.Core.Models.TestData.TestDataCertificate
    {
        MaxCertificates = newMaxCertificatesValue
    },
    Enrollment = new Client.Core.Models.TestData.TestDataEnrollment
    {
        MaxEnrollments = newMaxEnrollmentsValue
    }
};

await TestDataClient.ChangeCertificatesLimitInCurrentSubjectAsync(
    newCertificateLimitsForSubject,
    accessToken);
```

Java example:
[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
ChangeSubjectCertificateLimitRequest request = new ChangeSubjectCertificateLimitRequest();
request.setCertificate(new CertificateLimit(15));
request.setEnrollment(new EnrollmentLimit(15));
request.setSubjectIdentifierType(ChangeSubjectCertificateLimitRequest.SubjectType.NIP);

ksefClient.changeSubjectLimitTest(request, accessToken);
```

### Restoring Certificate Limits for Entity to Default Values ###

DELETE [/testdata/limits/subject/certificate](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1subject~1certificate/delete)

C# example:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
await TestDataClient.RestoreDefaultCertificatesLimitInCurrentSubjectAsync(accessToken);
```

Java example:
[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
ksefClient.resetSubjectCertificateLimit(accessToken);
```

Related documents: 
- [API Request Limits](limity-api.md)
- [Invoice Verification](../faktury/weryfikacja-faktury.md)
- [KSeF Certificates](../certyfikaty-KSeF.md)
