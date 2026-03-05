---
original: kody-qr.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [kody-qr.md](https://github.com/CIRFMF/ksef-docs/blob/main/kody-qr.md)

## QR-коды для верификации
21.08.2025

QR-код (Quick Response) — это графическое представление текста, чаще всего URL-адреса. В контексте KSeF это закодированная ссылка, содержащая данные, идентифицирующие счет — такой формат позволяет быстро считать информацию с помощью конечных устройств (смартфонов или оптических сканеров). Благодаря этому ссылка может быть отсканирована и перенаправлена непосредственно к соответствующему ресурсу системы KSeF, отвечающему за визуализацию и верификацию счета или сертификата KSeF эмитента.

QR-коды были введены для ситуаций, когда счет доходит до получателя другим каналом, чем прямая загрузка из API KSeF (например, как PDF, распечатка или приложение к электронной почте). В таких случаях каждый может:
- проверить, действительно ли данный счет находится в системе KSeF и не был ли он изменен,
- скачать его структурированную версию (XML-файл) без необходимости контакта с эмитентом,
- подтвердить подлинность эмитента (в случае офлайн-счетов).

Генерация кодов (как для онлайн, так и для офлайн-счетов) происходит локально в клиентском приложении на основе данных, содержащихся в выставленном счете. QR-код должен соответствовать стандарту ISO/IEC 18004:2024. Если нет возможности разместить код непосредственно на счете (например, формат данных это не позволяет), следует предоставить его получателю как отдельный графический файл или ссылку.

### Среды

Ниже приведены URL-адреса для отдельных сред KSeF, используемых для генерации QR-кодов:

| Сокращение | Среда                            | Адрес (QR)                                    |
|------------|----------------------------------|-----------------------------------------------|
| **TE**     | Тестовая <br/> (Release Candidate) | https://qr-test.ksef.mf.gov.pl                |
| **DEMO**   | Предпроизводственная (Demo/Preprod) | https://qr-demo.ksef.mf.gov.pl                |
| **PRD**    | Производственная                 | https://qr.ksef.mf.gov.pl                     |

> **Внимание**: Приведенные ниже примеры подготовлены для тестовой среды (TE). Для остальных сред следует выполнить аналогично, используя соответствующий URL-адрес из приведенной выше таблицы.

В зависимости от режима выставления (онлайн или офлайн) на визуализации счета размещается:
- в режиме **онлайн** — один QR-код (КОД I), позволяющий верифицировать и скачать счет из KSeF,
- в режиме **офлайн** — два QR-кода:
  - **КОД I** для верификации счета после его отправки в KSeF,
  - **КОД II** для подтверждения подлинности эмитента на основе [сертификата KSeF](/certyfikaty-KSeF.md).

### 1. КОД I – Верификация и загрузка счета

```КОД I``` содержит ссылку, позволяющую читать и верифицировать счет в системе KSeF.
После сканирования QR-кода или перехода по ссылке пользователь получит упрощенную презентацию основных данных счета и информацию о его присутствии в системе KSeF. Полный доступ к содержимому (например, загрузка XML-файла) требует ввода дополнительных данных.

#### Генерация ссылки
Ссылка состоит из:
- URL-адреса: `https://qr-test.ksef.mf.gov.pl/invoice`,
- даты выставления счета (поле `P_1`) в формате DD-MM-ГГГГ,
- NIP продавца,
- хеша файла счета, вычисленного алгоритмом SHA-256 (идентификатор файла счета) в формате Base64URL.

Например, для счета:
- дата выставления: "01-02-2026",
- NIP продавца: "1111111111",
- хеш SHA-256 в формате Base64URL: "UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE"

Сгенерированная ссылка выглядит следующим образом:
```
https://qr-test.ksef.mf.gov.pl/invoice/1111111111/01-02-2026/UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE
```

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeOnlineE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeOnlineE2ETests.cs)
```csharp
string url = linkSvc.BuildInvoiceVerificationUrl(nip, issueDate, invoiceHash);
```

Пример на Java:
```java
String url = linkSvc.buildInvoiceVerificationUrl(nip, issueDate, xml);
```

#### Генерация QR-кода
Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
private const int PixelsPerModule = 5;
byte[] qrBytes = qrCodeService.GenerateQrCode(url, PixelsPerModule);
```

Пример на Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.generateQrCode(invoiceForOnlineUrl);
```

#### Обозначение под QR-кодом
Процесс принятия счета системой KSeF обычно проходит мгновенно — номер KSeF генерируется незамедлительно после отправки документа. В исключительных случаях (например, высокая нагрузка системы) номер может быть присвоен с небольшой задержкой.

- **Если номер KSeF известен:** под QR-кодом размещается номер KSeF счета (касается онлайн-счетов и офлайн-счетов, уже отправленных в систему).

![QR KSeF](qr/qr-ksef.png)

- **Если номер KSeF еще не присвоен:** под QR-кодом размещается надпись **OFFLINE** (касается офлайн-счетов до отправки или онлайн-счетов, ожидающих номер).

![QR Offline](qr/qr-offline.png)

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
byte[] labeled = qrCodeService.AddLabelToQrCode(qrBytes, GeneratedQrCodeLabel);
```

Пример на Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.addLabelToQrCode(qrOnline, invoiceKsefNumber);
```

### 2. КОД II - Верификация сертификата

```КОД II``` генерируется исключительно для счетов, выставляемых в офлайн-режиме (offline24, offline-недоступность системы, аварийный режим) и выполняет функцию подтверждения подлинности **эмитента** и его полномочий на выставление счета от имени продавца. Генерация требует наличия активного [сертификата KSeF типа Offline](/certyfikaty-KSeF.md) — ссылка содержит криптографическую подпись URL с использованием закрытого ключа сертификата KSeF типа Offline, что предотвращает подделку ссылки субъектами, не имеющими доступа к сертификату.

> **Внимание**: Сертификат типа `Authentication` не может использоваться для генерации КОДА II. Его назначение — исключительно аутентификация в API.

Сертификат KSeF типа Offline можно получить с помощью эндпоинта [`/certificates`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments/post).

#### Верификация после сканирования QR-кода II

После перехода по ссылке из QR-кода система KSeF выполняет автоматическую верификацию сертификата эмитента.
Этот процесс включает следующие этапы:

1. **Сертификат KSeF эмитента**

   * Сертификат существует в реестре сертификатов KSeF и является **действительным**.
   * Сертификат не был **отозван**, **заблокирован** и не утратил действительность (`validTo`).

2. **Подпись эмитента**

   * Система проверяет **корректность подписи**, приложенной в URL.

3. **Полномочия эмитента**

   * Субъект, идентифицируемый сертификатом эмитента, обладает **активными полномочиями** для выставления счета в контексте (`ContextIdentifier`),
   * Верификация проходит согласно правилам, описанным в документе [uwierzytelnianie.md](uwierzytelnianie.md),
   * Например: бухгалтер, подписывающий счет от имени фирмы A, должен иметь назначенное право `InvoiceWrite` в контексте этой фирмы.

4. **Соответствие контекста и NIP продавца**

   * Система проверяет, имеет ли контекст (`ContextIdentifier`) право выставлять счета для данного **NIP продавца** (`Podmiot1` счета).
     Это касается, в частности, случаев:
     * самовыставления (`SelfInvoicing`),
     * налогового представителя (`TaxRepresentative`),
     * НДС-групп,
     * единиц JST,
     * подчиненных единиц, идентифицируемых внутренним идентификатором,
     * судебного пристава,
     * исполнительного органа,
     * счетов PEF, выставляемых от имени другого субъекта поставщиком услуг Peppol,
     * счетов, выставленных европейским субъектом.

    **Пример 1. Выставление счета субъектом в собственном контексте**

    Субъект выставляет счет, используя сертификат, содержащий его собственный номер NIP.
    Счет выставляется в контексте того же субъекта, а в поле NIP продавца указан его собственный номер NIP.

    | Идентификатор эмитента (сертификат) | Контекст   | NIP продавца |
    | -------------------------------------------- | ---------- | -------------- |
    | 1111111111                                   | 1111111111 | 1111111111     |

    **Пример 2. Выставление счета уполномоченным лицом от имени субъекта**

    Физическое лицо (например, бухгалтер), использующее сертификат KSeF, содержащий номер PESEL, выставляет счет в контексте субъекта, от имени которого имеет соответствующие полномочия.
    В поле NIP продавца указан номер NIP этого субъекта.

    | Идентификатор эмитента (сертификат) | Контекст   | NIP продавца |
    | -------------------------------------------- | ---------- | -------------- |
    | 22222222222                                  | 1111111111 | 1111111111     |

    **Пример 3. Выставление счета от имени другого субъекта**

    Физическое лицо выставляет счет в контексте субъекта A, однако на счете в поле NIP продавца указан номер NIP другого субъекта B.
    Такая ситуация возможна, когда субъект A имеет назначенные полномочия выставления счетов от имени субъекта B, например налоговый представитель, самовыставление.

    | Идентификатор эмитента (сертификат) | Контекст   | NIP продавца |
    | -------------------------------------------- | ---------- | -------------- |
    | 22222222222                                  | 1111111111 | 3333333333     |

#### Генерация ссылки

Верификационная ссылка состоит из:
- URL-адреса: `https://qr-test.ksef.mf.gov.pl/certificate`,
- типа идентификатора контекста входа ([`ContextIdentifier`](uwierzytelnianie.md)): "Nip", "InternalId", "NipVatUe", "PeppolId"
- значения идентификатора контекста входа,
- NIP продавца,
- серийного номера сертификата KSeF эмитента,
- хеша файла счета SHA-256 в формате Base64URL,
- подписи ссылки с использованием закрытого ключа сертификата KSeF эмитента (закодированная в формате Base64URL).

**Формат подписи**
Для подписи используется фрагмент пути URL без префикса протокола (https://) и без завершающего знака /, например:
```
qr-test.ksef.mf.gov.pl/certificate/Nip/1111111111/1111111111/01F20A5D352AE590/UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE
```

**Алгоритмы подписи:**

* **RSA (RSASSA-PSS)**
  - Функция хеширования: SHA-256
  - MGF: MGF1 с SHA-256
  - Длина случайной примеси (соли): 32 байта
  - Требуемая длина ключа: Минимум 2048 бит.

  Строка для подписи сначала хешируется алгоритмом SHA-256, а затем генерируется подпись согласно схеме RSASSA-PSS.

* **ECDSA (P-256/SHA-256)**
  Строка для подписи хешируется алгоритмом SHA-256, а затем генерируется подпись с использованием закрытого ключа ECDSA, основанного на кривой NIST P-256 (secp256r1), выбор которой следует указать при генерации CSR.

  Значение подписи — это пара целых чисел (r, s). Может быть закодировано в одном из двух форматов:
  - **IEEE P1363 Fixed Field Concatenation** — **рекомендуемый способ** ввиду более короткой результирующей строки и постоянной длины. Формат проще и короче, чем DER. Подпись — это конкатенация R || S (по 32 байта big-endian).
  - **ASN.1 DER SEQUENCE (RFC 3279)** — подпись кодируется как ASN.1 DER. Размер подписи переменный. Предлагаем использовать этот тип подписи только когда IEEE P1363 не возможен из-за технологических ограничений.

В обоих случаях (независимо от выбора RSA или ECDSA) полученное значение подписи следует закодировать в формате Base64URL.

Например, для счета:
- тип идентификатора контекста входа: "Nip",
- значение идентификатора контекста: "1111111111",
- NIP продавца: "1111111111",
- серийный номер сертификата KSeF эмитента: "01F20A5D352AE590",
- хеш SHA-256 в формате Base64URL: "UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE",
- подписи ссылки с использованием закрытого ключа сертификата KSeF эмитента: "mSkm_XmM9fq7PgAJwiL32L9ujhyguOEV48cDB0ncemD2r9TMGa3lr0iRoFk588agCi8QPsOuscUY1rZ7ff76STbGquO-gZtQys5_fHdf2HUfDqPqVTnUS6HknBu0zLkyf9ygoW7WbH06Ty_8BgQTlOmJFzNWSt9WZa7tAGuAE9JOooNps-KG2PYkkIP4q4jPMp3FKypAygHVnXtS0RDGgOxhhM7LWtFP7D-dWINbh5yXD8Lr-JVbeOpyQjHa6WmMYavCDQJ3X_Z-iS01LZu2s1B3xuOykl1h0sLObCdADrbxOONsXrvQa61Xt_rxyprVraj2Uf9pANQgR4-12HEcMw"

Сгенерированная ссылка выглядит следующим образом:

```
https://qr-test.ksef.mf.gov.pl/certificate/Nip/1111111111/1111111111/01F20A5D352AE590/UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE/mSkm_XmM9fq7PgAJwiL32L9ujhyguOEV48cDB0ncemD2r9TMGa3lr0iRoFk588agCi8QPsOuscUY1rZ7ff76STbGquO-gZtQys5_fHdf2HUfDqPqVTnUS6HknBu0zLkyf9ygoW7WbH06Ty_8BgQTlOmJFzNWSt9WZa7tAGuAE9JOooNps-KG2PYkkIP4q4jPMp3FKypAygHVnXtS0RDGgOxhhM7LWtFP7D-dWINbh5yXD8Lr-JVbeOpyQjHa6WmMYavCDQJ3X_Z-iS01LZu2s1B3xuOykl1h0sLObCdADrbxOONsXrvQa61Xt_rxyprVraj2Uf9pANQgR4-12HEcMw
```

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeOfflineE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeOfflineE2ETests.cs)
```csharp
 var certificate = new X509Certificate2(Convert.FromBase64String(certbase64));

 byte[] qrOfflineCode = QrCodeService.GenerateQrCode(
    linkService.BuildCertificateVerificationUrl(
        nip,
        nip,
        certificate.CertificateSerialNumber,
        invoiceHash,
        certificate));
```

Пример на Java:
[QrCodeOfflineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOfflineIntegrationTest.java)

```java
String pem = privateKeyPemBase64.replaceAll("\\s+", "");
byte[] keyBytes = java.util.Base64.getDecoder().decode(pem);

String url = verificationLinkService.buildCertificateVerificationUrl(
    contextNip,
    ContextIdentifierType.NIP,
    contextNip,
    certificate.getCertificateSerialNumber(),
    invoiceHash,
    cryptographyService.parsePrivateKeyFromPem(keyBytes));
```

#### Генерация QR-кода
Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
byte[] qrBytes = qrCodeService.GenerateQrCode(url, PixelsPerModule);
```

Пример на Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.generateQrCode(invoiceForOnlineUrl);
```

#### Обозначение под QR-кодом

Под QR-кодом должна находиться подпись **CERTYFIKAT**, указывающая на функцию верификации сертификата KSeF.

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
private const string GeneratedQrCodeLabel = "CERTYFIKAT";
byte[] labeled = qrCodeService.AddLabelToQrCode(qrBytes, GeneratedQrCodeLabel);
```

Пример на Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.addLabelToQrCode(qrOnline, invoiceKsefNumber);
```

![QR  Certyfikat](qr/qr-cert.png)
