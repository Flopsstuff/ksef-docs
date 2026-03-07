---
original: limity/limity.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [limity/limity.md](https://github.com/CIRFMF/ksef-docs/blob/main/limity/limity.md)

# Ліміти
21.10.2025

## Вступ

У системі KSeF 2.0 застосовано механізми, що обмежують кількість і розмір операцій API, а також параметри, пов'язані з переданими даними. Метою цих лімітів є:
- захист стабільності системи при великомасштабному функціонуванні,
- протидія зловживанням та неефективним інтеграціям,
- запобігання зловживанням та потенційним загрозам кібербезпеки,
- забезпечення рівних умов доступу для всіх користувачів.

Ліміти було розроблено з можливістю гнучкого налаштування під потреби конкретних суб'єктів, які потребують більшої інтенсивності операцій.

## Ліміти запитів API
Система KSeF обмежує кількість запитів, які можна надсилати за короткий час, щоб забезпечити стабільне функціонування системи та рівний доступ для всіх користувачів.
Докладніша інформація знаходиться в [Ліміти запитів API](limity-api.md).

## Ліміти на контекст

| Параметр                                                    | Значення за замовчуванням                       |
| ----------------------------------------------------------- | -------------------------------------- |
| Максимальний розмір рахунку-фактури без додатка                | 1 MB                                  |
| Максимальний розмір рахунку-фактури з додатком                 | 3 MB                                  |
| Максимальна кількість рахунків-фактур в інтерактивній/пакетній сесії | 10 000                                 |

## Ліміти на аутентифіковану особу

### Заявки та активні сертифікати

| Ідентифікатор з сертифіката            | Заявки на сертифікат KSeF | Активні сертифікати KSeF |
| -------------------------------------- | ------------------------- | ------------------------ |
| NIP                                    | 300                       | 100                      |
| PESEL                                  | 6                         | 2                        |
| Відбиток сертифіката (fingerprint) | 6                         | 2                        |



## Налаштування лімітів

Система KSeF дозволяє індивідуальне налаштування вибраних технічних лімітів для:
- лімітів API - наприклад, збільшення кількості запитів для вибраного endpoint'у,
- контексту - наприклад, збільшення максимального розміру рахунку-фактури,
- аутентифікованої особи - наприклад, збільшення лімітів активних сертифікатів KSeF для фізичної особи (PESEL).

У **виробничому середовищі** збільшення лімітів можливе виключно на підставі обґрунтованої заявки, підкріпленої реальною операційною потребою.
Заявка подається через [контактну форму](https://ksef.podatki.gov.pl/formularz/) з детальним описом використання.

## Перевірка індивідуальних лімітів
Система KSeF надає endpoint'и, що дозволяють перевірити поточні значення лімітів для поточного контексту або суб'єкта:

### Отримання лімітів для поточного контексту

GET [/limits/context](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1limits~1context/get)

Повертає значення діючих лімітів інтерактивних та пакетних сесій для поточного контексту.

Приклад мовою C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)
```csharp
Client.Core.Models.TestData.SessionLimitsInCurrentContextResponse limitsForContext =
    await LimitsClient.GetLimitsForCurrentContextAsync(
        accessToken,
        CancellationToken);
```
Приклад мовою Java:

[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
GetContextLimitResponse response = ksefClient.getContextSessionLimit(accessToken);
```

### Отримання лімітів для поточного суб'єкта

GET [/limits/subject](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1limits~1subject/get)

Повертає діючі ліміти сертифікатів та сертифікаційних заявок для поточного аутентифікованого суб'єкта.

Приклад мовою C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)
```csharp
Client.Core.Models.TestData.CertificatesLimitInCurrentSubjectResponse limitsForSubject =
        await LimitsClient.GetLimitsForCurrentSubjectAsync(
            accessToken,
            CancellationToken);
```

Приклад мовою Java:

[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
GetSubjectLimitResponse response = ksefClient.getSubjectCertificateLimit(accessToken);
```

## Модифікація лімітів у тестовому середовищі

У **тестовому середовищі** надано набір методів, що дозволяють змінювати та відновлювати ліміти до значень за замовчуванням.
Ці операції доступні виключно для аутентифікованих суб'єктів і не впливають на виробниче середовище.

### Зміна лімітів сесії для поточного контексту

POST [/testdata/limits/context/session](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1context~1session/post)

Приклад мовою C#:
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

Приклад мовою Java:

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

### Відновлення лімітів сесії для контексту до значень за замовчуванням

DELETE [/testdata/limits/context/session](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1context~1session/delete)

Приклад мовою C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
await TestDataClient.RestoreDefaultSessionLimitsInCurrentContextAsync(accessToken);
```

Приклад мовою Java:
[ContextLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ContextLimitIntegrationTest.java)

```java
ksefClient.resetContextLimitTest(accessToken);
```

### Зміна лімітів сертифікатів для поточного суб'єкта

POST [/testdata/limits/subject/certificate](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1subject~1certificate/post)

Приклад мовою C#:
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

Приклад мовою Java:
[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
ChangeSubjectCertificateLimitRequest request = new ChangeSubjectCertificateLimitRequest();
request.setCertificate(new CertificateLimit(15));
request.setEnrollment(new EnrollmentLimit(15));
request.setSubjectIdentifierType(ChangeSubjectCertificateLimitRequest.SubjectType.NIP);

ksefClient.changeSubjectLimitTest(request, accessToken);
```

### Відновлення лімітів сертифікатів для суб'єкта до значень за замовчуванням ###

DELETE [/testdata/limits/subject/certificate](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Limity-i-ograniczenia/paths/~1testdata~1limits~1subject~1certificate/delete)

Приклад мовою C#:
[KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Limits/LimitsE2ETests.cs)

```csharp
await TestDataClient.RestoreDefaultCertificatesLimitInCurrentSubjectAsync(accessToken);
```

Приклад мовою Java:
[SubjectLimitIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubjectLimitIntegrationTest.java)

```java
ksefClient.resetSubjectCertificateLimit(accessToken);
```

Пов'язані документи: 
- [Ліміти запитів API](limity-api.md)
- [Верифікація рахунку-фактури](../faktury/weryfikacja-faktury.md)
- [Сертифікати KSeF](../certyfikaty-KSeF.md)
