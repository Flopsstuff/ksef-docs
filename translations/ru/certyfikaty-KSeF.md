---
original: certyfikaty-KSeF.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [certyfikaty-KSeF.md](https://github.com/CIRFMF/ksef-docs/blob/main/certyfikaty-KSeF.md)

## Сертификаты KSeF
03.02.2026

### Введение

Сертификат KSeF является **носителем идентификации** аутентифицирующего субъекта (чаще всего идентифицируемого по **PESEL** или **NIP**, а в некоторых случаях по **fingerprint** сертификата, который использовался для аутентификации в момент подачи заявки на сертификат KSeF). Сертификат сам по себе **не несет никаких разрешений KSeF** и **не привязан к какому-либо контексту** (например, NIP компании / InternalId подразделения / NipVatUe). Разрешения управляются и проверяются **со стороны KSeF** на основе модели разрешений.

Эндпоинты для управления сертификатами доступны после [аутентификации](uwierzytelnianie.md). Эти операции касаются **аутентифицированного субъекта** (владельца сертификатов) и не связаны с контекстом входа в систему, в котором был получен токен доступа. Это означает, что данный аутентифицированный субъект (например, лицо, идентифицируемое по PESEL) имеет доступ к одному и тому же набору сертификатов независимо от контекста, в котором был получен токен доступа.

Заявка на выдачу сертификата KSeF может быть подана исключительно для данных, которые находятся в сертификате, использованном для [аутентификации](uwierzytelnianie.md). На основе этих данных эндпоинт [/certificates/enrollments/data](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1data/get) возвращает идентификационные данные, которые должны быть использованы в сертификационном запросе.

> Внимание: заявка на сертификат KSeF может быть подана исключительно "от собственного имени" – идентификационные данные для CSR читаются из сертификата, использованного для аутентификации, а их изменение приводит к отклонению заявки.

Доступны два типа сертификатов – каждый сертификат может иметь **только один тип** (`Authentication` или `Offline`). Невозможно выставить сертификат, объединяющий обе функции.

| Тип              | Описание |
| ---------------- | ---- |
| `Authentication` | Сертификат, предназначенный для аутентификации в системе KSeF.<br/>**keyUsage:** Digital Signature (80) |
| `Offline`        | Сертификат, предназначенный исключительно для выставления счетов в режиме оффлайн. Используется для подтверждения подлинности эмитента и целостности счета через [QR-код II](kody-qr.md). Не позволяет аутентификацию.<br/>**keyUsage:** Non-Repudiation (40) |

#### Процесс получения сертификата
Процесс подачи заявки на сертификат состоит из нескольких этапов:
1. Проверка доступных лимитов,
2. Получение данных для сертификационной заявки,
3. Отправка заявки,
4. Получение выданного сертификата,


### 1. Проверка лимитов

Прежде чем клиент API подаст заявку на выдачу нового сертификата, рекомендуется проверить лимит сертификатов.

API предоставляет информацию о:
* максимальном количестве сертификатов, которым можно обладать,
* количестве актуально активных сертификатов,
* возможности подачи следующей заявки.

GET [/certificates/limits](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1limits/get)

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateLimitResponse certificateLimitResponse = await KsefClient
    .GetCertificateLimitsAsync(accessToken, CancellationToken);
```

Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateLimitsResponse response = ksefClient.getCertificateLimits(accessToken);
```

### 2. Получение данных для сертификационной заявки

Чтобы начать процесс подачи заявки на сертификат KSeF, необходимо получить набор идентификационных данных, которые система вернет в ответ на вызов эндпоинта  
GET [/certificates/enrollments/data](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1data/get).

Эти данные читаются из сертификата, использованного для аутентификации, которым может быть:
- квалифицированный сертификат физического лица – содержащий номер PESEL или NIP,
- квалифицированный сертификат организации (так называемая корпоративная печать) – содержащий номер NIP,
- Доверенный профиль (ePUAP) – используемый физическими лицами, содержит номер PESEL,
- внутренний сертификат KSeF – выдаваемый системой KSeF, не является квалифицированным сертификатом, но принимается в процессе аутентификации.

На этой основе система возвращает полный набор атрибутов DN (X.500 Distinguished Name), которые должны быть использованы при построении сертификационного запроса (CSR). Изменение этих данных приведет к отклонению заявки.

**Внимание**: Получение сертификационных данных возможно исключительно после аутентификации с использованием подписи (XAdES). Аутентификация с использованием системного токена KSeF не позволяет подать заявку на сертификат.


Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateEnrollmentsInfoResponse certificateEnrollmentsInfoResponse =
    await KsefClient.GetCertificateEnrollmentDataAsync(accessToken, CancellationToken).ConfigureAwait(false);
```

Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateEnrollmentsInfoResponse response = ksefClient.getCertificateEnrollmentInfo(accessToken);
```

Вот полный список полей, которые могут быть возвращены, представленный в форме таблицы, содержащей OID:

| OID      | Название (англ.)          | Описание                                   | Физическое лицо | Корпоративная печать |
|----------|-----------------------|----------------------------------------|----------------|-----------------|
| 2.5.4.3  | commonName            | Общее имя                       | ✔️             | ✔️              |
| 2.5.4.4  | surname               | Фамилия                               | ✔️             | ❌              |
| 2.5.4.5  | serialNumber          | Серийный номер (например, PESEL, NIP)         | ✔️             | ❌              |
| 2.5.4.6  | countryName           | Код страны (например, PL)                     | ✔️             | ✔️              |
| 2.5.4.10 | organizationName      | Название организации / фирма              | ❌             | ✔️              |
| 2.5.4.42 | givenName             | Имя или имена                        | ✔️             | ❌              |
| 2.5.4.45 | uniqueIdentifier      | Уникальный идентификатор (необязательный)    | ✔️             | ✔️              |
| 2.5.4.97 | organizationIdentifier| Идентификатор организации (например, NIP)    | ❌             | ✔️              |


Атрибут `givenName` может появляться многократно и возвращается в виде списка значений. 

### 3. Подготовка CSR (Certificate Signing Request)
Чтобы подать заявку на сертификат KSeF, необходимо подготовить так называемый запрос подписания сертификата (CSR) в стандарте PKCS#10, в формате DER, кодированный в Base64. CSR содержит:
* информацию, идентифицирующую субъект (DN – Distinguished Name),
* публичный ключ, который будет связан с сертификатом.

Требования к приватному ключу, использованному для подписи CSR:
* Допустимые типы:
  * RSA (OID: 1.2.840.113549.1.1.1), длина ключа: 2048 бит,
  * EC (эллиптические ключи, OID: 1.2.840.10045.2.1), кривая NIST P-256 (secp256r1).
* Рекомендуется использовать ключи EC.

* Допустимые алгоритмы подписи:
  * RSA PKCS#1 v1.5,
  * RSA PSS,
  * ECDSA (формат подписи согласно RFC 3279).

* Допустимые функции хеширования, используемые для подписи CSR:
  * SHA1,
  * SHA256,
  * SHA384,
  * SHA512.

Все идентификационные данные (атрибуты X.509) должны соответствовать значениям, возвращенным системой на предыдущем шаге (/certificates/enrollments/data). Изменение этих данных приведет к отклонению заявки.

Пример на языке C# (с использованием ```ICryptographyService```):
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
var (csr, key) = CryptographyService.GenerateCsrWithRSA(TestFixture.EnrollmentInfo);
```


Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CsrResult csr = defaultCryptographyService.generateCsrWithRsa(enrollmentInfo);
```

* ```csrBase64Encoded``` – содержит запрос CSR, кодированный в формате Base64, готовый к отправке в KSeF
* ```privateKeyBase64Encoded``` – содержит приватный ключ, связанный с сгенерированным CSR, кодированный в Base64. Этот ключ понадобится для операций подписи при использовании сертификата.

**Внимание**: Приватный ключ должен храниться безопасным способом и в соответствии с политикой безопасности данной организации.

### 4. Отправка сертификационной заявки
После подготовки сертификационного запроса (CSR) необходимо отправить его в систему KSeF с помощью вызова 

POST [/certificates/enrollments](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments/post)

В отправляемой заявке необходимо указать:
* **название сертификата** – видимое позже в метаданных сертификата, облегчающее идентификацию,
* **тип сертификата** – `Authentication` или `Offline`,
* **CSR** в формате PKCS#10 (DER), кодированный как строка Base64,
* (необязательно) **validFrom** – дату начала действия. Если не указана, сертификат будет действителен с момента его выдачи.

Убедитесь, что CSR содержит точно те же данные, которые были возвращены эндпоинтом /certificates/enrollments/data.

Пример на языке C#:
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

Пример на языке Java:
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

В ответе вы получите ```referenceNumber```, который позволяет отслеживать статус заявки и в дальнейшем получить выданный сертификат.

### 5. Проверка статуса заявки

Процесс выдачи сертификата носит асинхронный характер. Это означает, что система не возвращает сертификат сразу после подачи заявки, а позволяет его получить позже после завершения обработки.
Статус заявки следует периодически проверять, используя номер ссылки (```referenceNumber```), который был возвращен в ответе на отправку заявки (/certificates/enrollments).

GET [/certificates/enrollments/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1%7BreferenceNumber%7D/get)

Если сертификационная заявка будет отклонена, в ответе мы получим информацию об ошибке.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
CertificateEnrollmentStatusResponse certificateEnrollmentStatusResponse = await KsefClient
    .GetCertificateEnrollmentStatusAsync(TestFixture.EnrollmentReference, accessToken, CancellationToken);
```

Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateEnrollmentStatusResponse response = ksefClient.getCertificateEnrollmentStatus(referenceNumber, accessToken);

```

После получения серийного номера сертификата (```certificateSerialNumber```), возможно получить его содержание и метаданные в следующих шагах процесса.

### 6. Получение списка сертификатов

Система KSeF позволяет получить содержание ранее выданных внутренних сертификатов на основе списка серийных номеров. Каждый сертификат возвращается в формате DER, кодированном как строка Base64.

POST [/certificates/retrieve](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1retrieve/post)

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
CertificateListRequest certificateListRequest = new CertificateListRequest { CertificateSerialNumbers = TestFixture.SerialNumbers };

CertificateListResponse certificateListResponse = await KsefClient
    .GetCertificateListAsync(certificateListRequest, accessToken, CancellationToken);
```

Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateListResponse certificateResponse = ksefClient.getCertificateList(new CertificateListRequest(List.of(certificateSerialNumber)), accessToken);
```

Каждый элемент ответа содержит:

| Поле                      | Описание    |
|---------------------------|------------------------|
| `certificateSerialNumber` | Серийный номер сертификата          |
| `certificateName` | Название сертификата, данное при регистрации          |
| `certificate` | Содержание сертификата, кодированное в Base64 (формат DER)          |
| `certificateType` | Тип сертификата (`Authentication`, `Offline`).          |

### 7. Получение списка метаданных сертификатов

Доступна возможность получить список внутренних сертификатов, поданных данным субъектом. Эти данные включают как активные, так и исторические сертификаты, вместе с их статусом, диапазоном действия и идентификаторами.

POST [/certificates/query](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1query/post)

Параметры фильтрации (необязательные):
* `status` - статус сертификата (`Active`, `Blocked`, `Revoked`, `Expired`)
* `expiresAfter` - дата окончания действия сертификата (необязательно)
* `name` - название сертификата (необязательно)
* `type` - тип сертификата (`Authentication`, `Offline`) (необязательно)
* `certificateSerialNumber` - серийный номер сертификата (необязательно)
* `pageSize` - количество элементов на странице (по умолчанию 10)
* `pageOffset` - номер страницы результатов (по умолчанию 0)

Пример на языке C#:
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
Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
QueryCertificatesRequest request = new CertificateMetadataListRequestBuilder().build();

CertificateMetadataListResponse response = ksefClient.getCertificateMetadataList(request, pageSize, pageOffset, accessToken);


```

В ответе мы получим метаданные сертификатов.



### 8. Аннулирование сертификатов

Сертификат KSeF может быть аннулирован только владельцем в случае компрометации приватного ключа, окончания его использования или организационного изменения. После аннулирования сертификат не может использоваться для дальнейшей аутентификации или выполнения операций в системе KSeF.
Аннулирование выполняется на основе серийного номера сертификата (```certificateSerialNumber```) и необязательной причины отзыва.

POST [/certificates/\{certificateSerialNumber\}/revoke](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1%7BcertificateSerialNumber%7D~1revoke/post)

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateRevokeRequest certificateRevokeRequest = RevokeCertificateRequestBuilder
        .Create()
        .WithRevocationReason(CertificateRevocationReason.KeyCompromise)
        .Build();

await ksefClient.RevokeCertificateAsync(request, certificateSerialNumber, accessToken, cancellationToken)
     .ConfigureAwait(false);
```

Пример на языке Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateRevokeRequest request = new CertificateRevokeRequestBuilder()
        .withRevocationReason(CertificateRevocationReason.KEYCOMPROMISE)
        .build();

ksefClient.revokeCertificate(request, serialNumber, accessToken);
```

После аннулирования сертификат не может быть повторно использован. Если возникнет необходимость его дальнейшего использования, следует подать заявку на новый сертификат.
