---
original: limity/limity.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [limity/limity.md](https://github.com/CIRFMF/ksef-docs/blob/main/limity/limity.md)

# Лимиты
21.10.2025

## Введение

В системе KSeF 2.0 применены механизмы, ограничивающие количество и размер операций API, а также параметры, связанные с передаваемыми данными. Цель этих лимитов:
- защита стабильности системы при большом масштабе работы,
- противодействие злоупотреблениям и неэффективным интеграциям,
- предотвращение злоупотреблений и потенциальных угроз кибербезопасности,
- обеспечение равных условий доступа для всех пользователей.

Лимиты были разработаны с возможностью гибкой настройки под потребности конкретных субъектов, требующих более высокой интенсивности операций.

## Лимиты запросов API
Система KSeF ограничивает количество запросов, которые можно отправлять в короткое время, чтобы обеспечить стабильную работу системы и равный доступ для всех пользователей.
Подробная информация находится в разделе [Лимиты запросов API](limity-api.md).

## Лимиты на контекст

| Параметр                                                    | Значение по умолчанию                  |
| ----------------------------------------------------------- | -------------------------------------- |
| Максимальный размер счета без вложения                      | 1 МБ                                   |
| Максимальный размер счета с вложением                       | 3 МБ                                   |
| Максимальное количество счетов в интерактивной/пакетной сессии | 10 000                                 |

## Лимиты на аутентифицированный субъект

### Заявки и активные сертификаты

| Идентификатор из сертификата           | Заявки на сертификат KSeF | Активные сертификаты KSeF |
| -------------------------------------- | ------------------------- | ------------------------ |
| NIP                                    | 300                       | 100                      |
| PESEL                                  | 6                         | 2                        |
| Отпечаток сертификата (fingerprint)    | 6                         | 2                        |



## Настройка лимитов

Система KSeF позволяет индивидуально настроить выбранные технические лимиты для:
- лимитов API - например, увеличение количества запросов для выбранного endpoint'а,
- контекста - например, увеличение максимального размера счета,
- аутентифицирующего субъекта - например, увеличение лимитов активных сертификатов KSeF для физического лица (PESEL).

В **производственной среде** увеличение лимитов возможно исключительно на основании обоснованной заявки, подкрепленной реальной операционной потребностью.
Заявка подается через [контактную форму](https://ksef.podatki.gov.pl/formularz/), вместе с подробным описанием применения.

## Проверка индивидуальных лимитов
Система KSeF предоставляет endpoint'ы, позволяющие проверить текущие значения лимитов для текущего контекста или субъекта:

### Получение лимитов для текущего контекста

GET [/limits/context](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1limits~1context/get)

Возвращает значения действующих лимитов интерактивных и пакетных сессий для текущего контекста.

Пример на языке C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)
```csharp
Client.Core.Models.TestData.SessionLimitsInCurrentContextResponse limitsForContext =
    await LimitsClient.GetLimitsForCurrentContextAsync(
        accessToken,
        CancellationToken);
```
Пример на языке Java:

[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
GetContextLimitResponse response = ksefClient.getContextSessionLimit(accessToken);
```

### Получение лимитов для текущего субъекта

GET [/limits/subject](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1limits~1subject/get)

Возвращает действующие лимиты сертификатов и заявок на сертификацию для текущего аутентифицированного субъекта.

Пример на языке C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)
```csharp
Client.Core.Models.TestData.CertificatesLimitInCurrentSubjectResponse limitsForSubject =
        await LimitsClient.GetLimitsForCurrentSubjectAsync(
            accessToken,
            CancellationToken);
```

Пример на языке Java:

[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
GetSubjectLimitResponse response = ksefClient.getSubjectCertificateLimit(accessToken);
```

## Модификация лимитов в тестовой среде

В **тестовой среде** предоставлен набор методов, позволяющих изменить лимиты, а также восстановить их до значений по умолчанию.
Эти операции доступны исключительно для аутентифицированных субъектов и не влияют на производственную среду.

### Изменение лимитов сессии для текущего контекста

POST [/testdata/limits/context/session](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1context~1session/post)

Пример на языке C#:
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

Пример на языке Java:

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

### Восстановление лимитов сессии для контекста до значений по умолчанию

DELETE [/testdata/limits/context/session](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1context~1session/delete)

Пример на языке C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
await TestDataClient.RestoreDefaultSessionLimitsInCurrentContextAsync(accessToken);
```

Пример на языке Java:
[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
ksefClient.resetContextLimitTest(accessToken);
```

### Изменение лимитов сертификатов для текущего субъекта

POST [/testdata/limits/subject/certificate](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1subject~1certificate/post)

Пример на языке C#:
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

Пример на языке Java:
[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
ChangeSubjectCertificateLimitRequest request = new ChangeSubjectCertificateLimitRequest();
request.setCertificate(new CertificateLimit(15));
request.setEnrollment(new EnrollmentLimit(15));
request.setSubjectIdentifierType(ChangeSubjectCertificateLimitRequest.SubjectType.NIP);

ksefClient.changeSubjectLimitTest(request, accessToken);
```

### Восстановление лимитов сертификатов для субъекта до значений по умолчанию ###

DELETE [/testdata/limits/subject/certificate](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1subject~1certificate/delete)

Пример на языке C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
await TestDataClient.RestoreDefaultCertificatesLimitInCurrentSubjectAsync(accessToken);
```

Пример на языке Java:
[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
ksefClient.resetSubjectCertificateLimit(accessToken);
```

Связанные документы: 
- [Лимиты запросов api](limity-api.md)
- [Верификация счета](../faktury/weryfikacja-faktury.md)
- [Сертификаты KSeF](../certyfikaty-KSeF.md)
