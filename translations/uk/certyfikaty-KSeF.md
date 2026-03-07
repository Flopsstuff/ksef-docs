---
original: certyfikaty-KSeF.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [certyfikaty-KSeF.md](https://github.com/CIRFMF/ksef-docs/blob/main/certyfikaty-KSeF.md)

## Сертифікати KSeF
03.02.2026

### Вступ

Сертифікат KSeF є **носієм ідентичності** суб'єкта, що здійснює автентифікацію (найчастіше ідентифікується за **PESEL** або **NIP**, а в деяких випадках за **fingerprint** сертифіката, який використовувався для автентифікації на момент подання заявки на сертифікат KSeF). Сертифікат сам по собі **не надає жодних дозволів KSeF** і **не прив'язаний до жодного контексту** (напр. NIP компанії / InternalId підрозділу / NipVatUe). Дозволи керуються та перевіряються **на стороні KSeF** на основі моделі дозволів.

Ендпоінти для керування сертифікатами доступні після [автентифікації](uwierzytelnianie.md). Ці операції стосуються **автентифікованого суб'єкта** (власника сертифікатів) і не пов'язані з контекстом входу, в якому отримано токен доступу. Це означає, що даний автентифікований суб'єкт (напр. особа, ідентифікована за PESEL) має доступ до того самого набору сертифікатів незалежно від контексту, в якому було отримано токен доступу.

Заявка на видачу сертифіката KSeF може бути подана виключно для даних, які знаходяться в сертифікаті, використаному для [автентифікації](uwierzytelnianie.md). На основі цих даних ендпоінт [/certificates/enrollments/data](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1data/get) повертає ідентифікаційні дані, які повинні бути використані в сертифікаційному запиті.

> Увага: заявка на сертифікат KSeF може бути подана виключно "від власного імені" – ідентифікаційні дані для CSR зчитуються з сертифіката, використаного для автентифікації, а їх модифікація призводить до відхилення заявки.

Доступні два типи сертифікатів – кожен сертифікат може мати **тільки один тип** (`Authentication` або `Offline`). Неможливо видати сертифікат, що поєднує обидві функції.

| Тип              | Опис |
| ---------------- | ---- |
| `Authentication` | Сертифікат призначений для автентифікації в системі KSeF.<br/>**keyUsage:** Digital Signature (80) |
| `Offline`        | Сертифікат призначений виключно для виставлення рахунків у режимі офлайн. Використовується для підтвердження автентичності виставляючої сторони та цілісності рахунку за допомогою [коду QR II](kody-qr.md). Не дозволяє автентифікацію.<br/>**keyUsage:** Non-Repudiation (40) |

#### Процес отримання сертифіката
Процес подання заявки на сертифікат складається з кількох етапів:
1. Перевірка доступних лімітів,
2. Отримання даних для сертифікаційної заявки,
3. Надсилання заявки,
4. Отримання виданого сертифіката,


### 1. Перевірка лімітів

Перед тим, як клієнт API подасть заявку на видачу нового сертифіката, рекомендується перевірити ліміт сертифікатів.

API надає інформацію про:
* максимальну кількість сертифікатів, якими можна розпоряджатися,
* кількість поточно активних сертифікатів,
* можливість подання наступної заявки.

GET [/certificates/limits](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1limits/get)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateLimitResponse certificateLimitResponse = await KsefClient
    .GetCertificateLimitsAsync(accessToken, CancellationToken);
```

Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateLimitsResponse response = ksefClient.getCertificateLimits(accessToken);
```

### 2. Отримання даних для сертифікаційної заявки

Щоб розпочати процес подання заявки на сертифікат KSeF, необхідно отримати набір ідентифікаційних даних, які система поверне у відповідь на виклик ендпоінта  
GET [/certificates/enrollments/data](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1data/get).

Ці дані зчитуються з сертифіката, використаного для автентифікації, яким може бути:
- кваліфікований сертифікат фізичної особи – що містить номер PESEL або NIP,
- кваліфікований сертифікат організації (так звана корпоративна печатка) – що містить номер NIP,
- Профіль довіри (ePUAP) – використовується фізичними особами, містить номер PESEL,
- внутрішній сертифікат KSeF – видається системою KSeF, не є кваліфікованим сертифікатом, але шанується в процесі автентифікації.

Система на цій основі повертає комплект атрибутів DN (X.500 Distinguished Name), які повинні бути використані при побудові сертифікаційного запиту (CSR). Модифікація цих даних спричинить відхилення заявки.

**Увага**: Отримання сертифікаційних даних можливе виключно після автентифікації з використанням підпису (XAdES). Автентифікація з використанням системного токена KSeF не дозволяє подачу заявки на сертифікат.


Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateEnrollmentsInfoResponse certificateEnrollmentsInfoResponse =
    await KsefClient.GetCertificateEnrollmentDataAsync(accessToken, CancellationToken).ConfigureAwait(false);
```

Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateEnrollmentsInfoResponse response = ksefClient.getCertificateEnrollmentInfo(accessToken);
```

Ось повний перелік полів, які можуть бути повернуті, представлений у формі таблиці з OID:

| OID      | Назва (англ.)          | Опис                                   | Фізична особа | Корпоративна печатка |
|----------|-----------------------|----------------------------------------|----------------|-----------------|
| 2.5.4.3  | commonName            | Загальна назва                       | ✔️             | ✔️              |
| 2.5.4.4  | surname               | Прізвище                               | ✔️             | ❌              |
| 2.5.4.5  | serialNumber          | Серійний номер (напр. PESEL, NIP)         | ✔️             | ❌              |
| 2.5.4.6  | countryName           | Код країни (напр. PL)                     | ✔️             | ✔️              |
| 2.5.4.10 | organizationName      | Назва організації / компанії              | ❌             | ✔️              |
| 2.5.4.42 | givenName             | Ім'я або імена                        | ✔️             | ❌              |
| 2.5.4.45 | uniqueIdentifier      | Унікальний ідентифікатор (опціональний)    | ✔️             | ✔️              |
| 2.5.4.97 | organizationIdentifier| Ідентифікатор організації (напр. NIP)    | ❌             | ✔️              |


Атрибут `givenName` може з'являтися багатократно і повертається у вигляді списку значень. 

### 3. Підготовка CSR (Certificate Signing Request)
Щоб подати заявку на сертифікат KSeF, необхідно підготувати так званий запит на підписання сертифіката (CSR) у стандарті PKCS#10, у форматі DER, закодований у Base64. CSR містить:
* інформацію, що ідентифікує суб'єкта (DN – Distinguished Name),
* відкритий ключ, який буде пов'язаний з сертифікатом.

Вимоги до приватного ключа, використаного для підпису CSR:
* Дозволені типи:
  * RSA (OID: 1.2.840.113549.1.1.1), довжина ключа: 2048 біт,
  * EC (еліптичні ключі, OID: 1.2.840.10045.2.1), крива NIST P-256 (secp256r1).
* Рекомендується використання ключів EC.

* Дозволені алгоритми підпису:
  * RSA PKCS#1 v1.5,
  * RSA PSS,
  * ECDSA (формат підпису згідно з RFC 3279).

* Дозволені функції хешування, використані для підпису CSR:
  * SHA1,
  * SHA256,
  * SHA384,
  * SHA512.

Усі ідентифікаційні дані (атрибути X.509) повинні відповідати значенням, повернутим системою на попередньому кроці (/certificates/enrollments/data). Модифікація цих даних спричинить відхилення заявки.

Приклад мовою C# (з використанням ```ICryptographyService```):
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
var (csr, key) = CryptographyService.GenerateCsrWithRSA(TestFixture.EnrollmentInfo);
```


Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CsrResult csr = defaultCryptographyService.generateCsrWithRsa(enrollmentInfo);
```

* ```csrBase64Encoded``` – містить запит CSR, закодований у форматі Base64, готовий для надсилання до KSeF
* ```privateKeyBase64Encoded``` – містить приватний ключ, пов'язаний з згенерованим CSR, закодований у Base64. Цей ключ знадобиться для операцій підпису при використанні сертифіката.

**Увага**: Приватний ключ повинен зберігатися безпечним способом і згідно з політикою безпеки даної організації.

### 4. Надсилання сертифікаційної заявки
Після підготовки запиту на сертифікацію (CSR) необхідно надіслати його до системи KSeF за допомогою виклику 

POST [/certificates/enrollments](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments/post)

У заявці, що надсилається, необхідно вказати:
* **назву сертифіката** – видиму пізніше в метаданих сертифіката, що полегшує ідентифікацію,
* **тип сертифіката** – `Authentication` або `Offline`,
* **CSR** у форматі PKCS#10 (DER), закодований як рядок Base64,
* (опціонально) **validFrom** – дату початку чинності. Якщо не буде вказана, сертифікат буде чинним з моменту його видачі.

Переконайтеся, що CSR містить точно ті самі дані, які були повернуті ендпоінтом /certificates/enrollments/data.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
SendCertificateEnrollmentRequest sendCertificateEnrollmentRequest = SendCertificateEnrollmentRequestBuilder
    .Create()
    .WithCertificateName(TestCertificateName)
    .WithCertificateType(CertificateType.Authentication)
    .WithCsr(csr)
    .WithValidFrom(DateTimeOffset.UtcNow.AddDays(CertificateValidityDays))
    .Build();

CertificateEnrollmentResponse certificateEnrollmentResponse = await KsefClient
    .SendCertificateEnrollmentAsync(sendCertificateEnrollmentRequest, accessToken, CancellationToken);
```

Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
SendCertificateEnrollmentRequest request = new SendCertificateEnrollmentRequestBuilder()
        .withValidFrom(OffsetDateTime.now().toString())
        .withCsr(csr.csr())
        .withCertificateName("certificate")
        .withCertificateType(CertificateType.AUTHENTICATION)
        .build();

CertificateEnrollmentResponse response = ksefClient.sendCertificateEnrollment(request, accessToken);
```

У відповідь ви отримаєте ```referenceNumber```, який дозволяє відстежувати статус заявки та пізніше отримати виданий сертифікат.

### 5. Перевірка статусу заявки

Процес видачі сертифіката має асинхронний характер. Це означає, що система не повертає сертифікат одразу після подання заявки, а дозволяє його пізніше отримати після завершення обробки.
Статус заявки необхідно періодично перевіряти, використовуючи референтний номер (```referenceNumber```), який було повернуто у відповідь на надсилання заявки (/certificates/enrollments).

GET [/certificates/enrollments/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1%7BreferenceNumber%7D/get)

Якщо сертифікаційна заявка буде відхилена, у відповідь отримаємо інформацію про помилку.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
CertificateEnrollmentStatusResponse certificateEnrollmentStatusResponse = await KsefClient
    .GetCertificateEnrollmentStatusAsync(TestFixture.EnrollmentReference, accessToken, CancellationToken);
```

Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateEnrollmentStatusResponse response = ksefClient.getCertificateEnrollmentStatus(referenceNumber, accessToken);

```

Після отримання серійного номера сертифіката (```certificateSerialNumber```) можливе отримання його вмісту та метаданих у наступних кроках процесу.

### 6. Отримання списку сертифікатів

Система KSeF дозволяє отримати вміст раніше виданих внутрішніх сертифікатів на основі списку серійних номерів. Кожен сертифікат повертається у форматі DER, закодованому як рядок Base64.

POST [/certificates/retrieve](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1retrieve/post)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
CertificateListRequest certificateListRequest = new CertificateListRequest { CertificateSerialNumbers = TestFixture.SerialNumbers };

CertificateListResponse certificateListResponse = await KsefClient
    .GetCertificateListAsync(certificateListRequest, accessToken, CancellationToken);
```

Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateListResponse certificateResponse = ksefClient.getCertificateList(new CertificateListRequest(List.of(certificateSerialNumber)), accessToken);
```

Кожен елемент відповіді містить:

| Поле                      | Опис    |
|---------------------------|------------------------|
| `certificateSerialNumber` | Серійний номер сертифіката          |
| `certificateName` | Назва сертифіката, надана при реєстрації          |
| `certificate` | Вміст сертифіката, закодований у Base64 (формат DER)          |
| `certificateType` | Тип сертифіката (`Authentication`, `Offline`).          |

### 7. Отримання списку метаданих сертифікатів

Доступна можливість отримання списку внутрішніх сертифікатів, поданих даним суб'єктом. Ці дані включають як активні, так і історичні сертифікати разом з їх статусом, терміном чинності та ідентифікаторами.

POST [/certificates/query](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1query/post)

Параметри фільтрування (опціональні):
* `status` - статус сертифіката (`Active`, `Blocked`, `Revoked`, `Expired`)
* `expiresAfter` - дата закінчення чинності сертифіката (опціональна)
* `name` - назва сертифіката (опціональна)
* `type` - тип сертифіката (`Authentication`, `Offline`) (опціональний)
* `certificateSerialNumber` - серійний номер сертифіката (опціональний)
* `pageSize` - кількість елементів на сторінці (за замовчуванням 10)
* `pageOffset` - номер сторінки результатів (за замовчуванням 0)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificateMetadataListE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificateMetadataListE2ETests.cs)

```csharp
var request = GetCertificateMetadataListRequestBuilder
    .Create()
    .WithCertificateSerialNumber(serialNumber)
    .WithName(name)
    .Build();
    CertificateMetadataListResponse certificateMetadataListResponse = await KsefClient
            .GetCertificateMetadataListAsync(accessToken, requestPayload, pageSize, pageOffset, CancellationToken);
```
Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
QueryCertificatesRequest request = new CertificateMetadataListRequestBuilder().build();

CertificateMetadataListResponse response = ksefClient.getCertificateMetadataList(request, pageSize, pageOffset, accessToken);


```

У відповідь отримаємо метадані сертифікатів.



### 8. Скасування сертифікатів

Сертифікат KSeF може бути скасований лише власником у випадку компрометації приватного ключа, завершення його використання або організаційної зміни. Після скасування сертифікат не може бути використаний для подальшої автентифікації або реалізації операцій у системі KSeF.
Скасування реалізується на основі серійного номера сертифіката (```certificateSerialNumber```) та опціональної причини відкликання.

POST [/certificates/\{certificateSerialNumber\}/revoke](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1%7BcertificateSerialNumber%7D~1revoke/post)

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateRevokeRequest certificateRevokeRequest = RevokeCertificateRequestBuilder
        .Create()
        .WithRevocationReason(CertificateRevocationReason.KeyCompromise)
        .Build();

await ksefClient.RevokeCertificateAsync(request, certificateSerialNumber, accessToken, cancellationToken)
     .ConfigureAwait(false);
```

Приклад мовою Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateRevokeRequest request = new CertificateRevokeRequestBuilder()
        .withRevocationReason(CertificateRevocationReason.KEYCOMPROMISE)
        .build();

ksefClient.revokeCertificate(request, serialNumber, accessToken);
```

Після скасування сертифікат не може бути повторно використаний. Якщо виникне потреба в його подальшому використанні, необхідно подати заявку на новий сертифікат.
