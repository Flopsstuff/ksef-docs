---
original: kody-qr.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [kody-qr.md](https://github.com/CIRFMF/ksef-docs/blob/main/kody-qr.md)

## Коди верифікації QR
21.08.2025

Код QR (Quick Response) — це графічне представлення тексту, найчастіше адреси URL. У контексті KSeF це закодоване посилання, що містить дані для ідентифікації рахунку-фактури — такий формат дозволяє швидко зчитувати інформацію за допомогою кінцевих пристроїв (смартфонів або оптичних сканерів). Завдяки цьому посилання може бути зскановане та перенаправлене безпосередньо до відповідного ресурсу системи KSeF, відповідального за візуалізацію та верифікацію рахунку-фактури або сертифікату KSeF видавця.

Коди QR введено з огляду на ситуації, коли рахунок-фактура потрапляє до отримувача іншим каналом, ніж безпосереднє завантаження з API KSeF (наприклад, як PDF, роздрукований примірник чи додаток до електронної пошти). У таких випадках кожен може:
- перевірити, чи справді знаходиться даний рахунок-фактура у системі KSeF і чи не було його змінено,
- завантажити його структуровану версію (файл XML) без потреби контактувати з видавцем,
- підтвердити автентичність видавця (у випадку рахунків-фактур offline).

Генерування кодів (як для рахунків-фактур online, так і offline) відбувається локально в клієнтській програмі на основі даних, що містяться у виданому рахунку-фактурі. Код QR повинен відповідати нормі ISO/IEC 18004:2024. Якщо немає можливості розмістити код безпосередньо на рахунку-фактурі (наприклад, формат даних цього не дозволяє), слід надати його отримувачу як окремий графічний файл або посилання.

### Середовища

Нижче зведено адреси URL для окремих середовищ KSeF, що використовуються для генерування кодів QR:

| Скорочення | Середовище                        | Адреса (QR)                                   |
|-----------|-----------------------------------|-----------------------------------------------|
| **TE**    | Тестове <br/> (Release Candidate) | https://qr-test.ksef.mf.gov.pl                |
| **DEMO**  | Передпродуктивне (Demo/Preprod)   | https://qr-demo.ksef.mf.gov.pl                |
| **PRD**   | Продуктивне                       | https://qr.ksef.mf.gov.pl                     |

> **Увага**: Наведені нижче приклади підготовлено для тестового середовища (TE). Для інших середовищ слід виконати аналогічно, використовуючи відповідну адресу URL з наведеної вище таблиці.

Залежно від режиму видання (online чи offline) на візуалізації рахунку-фактури розміщується:
- у режимі **online** — один код QR (КОД I), що дозволяє верифікацію та завантаження рахунку-фактури з KSeF,
- у режимі **offline** — два коди QR:
  - **КОД I** для верифікації рахунку-фактури після його надсилання до KSeF,
  - **КОД II** для підтвердження автентичності видавця на основі [сертифікату KSeF](/certyfikaty-KSeF.md).

### 1. КОД I – Верифікація та завантаження рахунку-фактури

```КОД I``` містить посилання, що дозволяє зчитування та верифікацію рахунку-фактури в системі KSeF.
Після сканування коду QR або натискання посилання користувач отримає спрощену презентацію основних даних рахунку-фактури та інформацію про його присутність у системі KSeF. Повний доступ до змісту (наприклад, завантаження файлу XML) вимагає введення додаткових даних.

#### Генерування посилання
Посилання складається з:
- адреси URL: `https://qr-test.ksef.mf.gov.pl/invoice`,
- дати видання рахунку-фактури (поле `P_1`) у форматі DD-MM-РРРР,
- ПДВ номера продавця,
- хешу файлу рахунку-фактури, обчисленого алгоритмом SHA-256 (ідентифікатор файлу рахунку-фактури) у форматі Base64URL.

Наприклад, для рахунку-фактури:
- дата видання: "01-02-2026",
- ПДВ номер продавця: "1111111111",
- хеш SHA-256 у форматі Base64URL: "UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE"

Згенероване посилання виглядає наступним чином:
```
https://qr-test.ksef.mf.gov.pl/invoice/1111111111/01-02-2026/UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE
```

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeOnlineE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeOnlineE2ETests.cs)
```csharp
string url = linkSvc.BuildInvoiceVerificationUrl(nip, issueDate, invoiceHash);
```

Приклад мовою Java:
```java
String url = linkSvc.buildInvoiceVerificationUrl(nip, issueDate, xml);
```

#### Генерування коду QR
Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
private const int PixelsPerModule = 5;
byte[] qrBytes = qrCodeService.GenerateQrCode(url, PixelsPerModule);
```

Приклад мовою Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.generateQrCode(invoiceForOnlineUrl);
```

#### Позначення під кодом QR
Процес прийняття рахунку-фактури системою KSeF зазвичай відбувається миттєво — номер KSeF генерується негайно після надсилання документа. У виняткових випадках (наприклад, високе навантаження системи) номер може бути наданий із незначною затримкою.

- **Якщо номер KSeF відомий:** під кодом QR розміщується номер KSeF рахунку-фактури (стосується рахунків-фактур online та рахунків-фактур offline, уже надісланих до системи).

![QR KSeF](qr/qr-ksef.png)

- **Якщо номер KSeF ще не наданий:** під кодом QR розміщується напис **OFFLINE** (стосується рахунків-фактур offline перед надсиланням або online, що очікують на номер).

![QR Offline](qr/qr-offline.png)

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
byte[] labeled = qrCodeService.AddLabelToQrCode(qrBytes, GeneratedQrCodeLabel);
```

Приклад мовою Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.addLabelToQrCode(qrOnline, invoiceKsefNumber);
```

### 2. КОД II - Верифікація сертифікату

```КОД II``` генерується виключно для рахунків-фактур, що видаються в режимі offline (offline24, offline-недоступність системи, аварійний режим) і виконує функцію підтвердження автентичності **видавця** та його повноважень щодо видання рахунку-фактури від імені продавця. Генерування вимагає наявності активного [сертифікату KSeF типу Offline](/certyfikaty-KSeF.md) – посилання містить криптографічний підпис URL із використанням приватного ключа сертифікату KSeF типу Offline, що запобігає підробці посилання суб'єктами, що не мають доступу до сертифікату.

> **Увага**: Сертифікат типу `Authentication` не може використовуватись для генерування КОДУ II. Його призначенням є виключно автентифікація в API.

Сертифікат KSeF типу Offline можна отримати за допомогою endpoint'у [`/certificates`](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments/post).


#### Верифікація після сканування коду QR II

Після переходу за посиланням з коду QR система KSeF здійснює автоматичну верифікацію сертифікату видавця.
Цей процес включає наступні етапи:

1. **Сертифікат KSeF видавця**

   * Сертифікат існує в реєстрі сертифікатів KSeF і є **дійсним**.
   * Сертифікат не був **відкликаний**, **заблокований** або не втратив чинності (`validTo`).

2. **Підпис видавця**

   * Система верифікує **правильність підпису**, доданого в URL.

3. **Повноваження видавця**

   * Суб'єкт, ідентифікований сертифікатом видавця, має **активні повноваження** щодо видання рахунку-фактури в контексті (`ContextIdentifier`),
   * Верифікація відбувається згідно з принципами, описаними в документі [uwierzytelnianie.md](uwierzytelnianie.md),
   * Наприклад: бухгалтер, що підписує рахунок-фактуру від імені фірми А, повинен мати надане право `InvoiceWrite` у контексті цієї фірми.

4. **Відповідність контексту та ПДВ номера продавця**

   * Система перевіряє, чи контекст (`ContextIdentifier`) має право на видання рахунку-фактури для даного **ПДВ номера продавця** (`Podmiot1` рахунку-фактури).
     Це стосується, зокрема, випадків:
     * самовиставлення рахунків-фактур (`SelfInvoicing`),
     * податковий представник (`TaxRepresentative`),
     * групи ПДВ,
     * одиниці МСВ,
     * підпорядковані одиниці, ідентифіковані внутрішнім ідентифікатором,
     * судовий виконавець,
     * виконавчий орган,
     * рахунки-фактури PEF, що видаються від імені іншого суб'єкта постачальником послуг Peppol,
     * рахунки-фактури, видані європейським суб'єктом.

    **Приклад 1. Видання рахунку-фактури суб'єктом у власному контексті**

    Суб'єкт видає рахунок-фактуру, використовуючи сертифікат, що містить його власний ПДВ номер.
    Рахунок-фактура видається в контексті того самого суб'єкта, а в полі ПДВ номер продавця вказаний його власний ПДВ номер.

    | Ідентифікатор видавця (сертифікат) | Контекст   | ПДВ номер продавця |
    | -------------------------------------------- | ---------- | -------------- |
    | 1111111111                                   | 1111111111 | 1111111111     |

    **Приклад 2. Видання рахунку-фактури уповноваженою особою від імені суб'єкта**

    Фізична особа (наприклад, бухгалтер), що користується сертифікатом KSeF із номером РНОКПП, видає рахунок-фактуру в контексті суб'єкта, від імені якого вона має відповідні повноваження.
    У полі ПДВ номер продавця вказаний номер ПДВ цього суб'єкта.


    | Ідентифікатор видавця (сертифікат) | Контекст   | ПДВ номер продавця |
    | -------------------------------------------- | ---------- | -------------- |
    | 22222222222                                  | 1111111111 | 1111111111     |


    **Приклад 3. Видання рахунку-фактури від імені іншого суб'єкта**

    Фізична особа видає рахунок-фактуру в контексті суб'єкта А, однак на рахунку-фактурі в полі ПДВ номер продавця вказаний номер ПДВ іншого суб'єкта Б.
    Така ситуація можлива, коли суб'єкт А має надані повноваження щодо видання рахунків-фактур від імені суб'єкта Б, наприклад, податковий представник, самовиставлення рахунків-фактур.

    | Ідентифікатор видавця (сертифікат) | Контекст   | ПДВ номер продавця |
    | -------------------------------------------- | ---------- | -------------- |
    | 22222222222                                  | 1111111111 | 3333333333     |


#### Генерування посилання

Посилання верифікації складається з:
- адреси URL: `https://qr-test.ksef.mf.gov.pl/certificate`,
- типу ідентифікатора контексту входу в систему ([`ContextIdentifier`](uwierzytelnianie.md)): "Nip", "InternalId", "NipVatUe", "PeppolId"
- значення ідентифікатора контексту входу в систему,
- ПДВ номера продавця,
- серійного номера сертифікату KSeF видавця,
- хешу файлу рахунку-фактури SHA-256 у форматі Base64URL,
- підпису посилання з використанням приватного ключа сертифікату KSeF видавця (закодований у форматі Base64URL).

**Формат підпису**  
Для підпису використовується фрагмент шляху URL без префіксу протоколу (https://) та без кінцевого знаку /, наприклад:
```
qr-test.ksef.mf.gov.pl/certificate/Nip/1111111111/1111111111/01F20A5D352AE590/UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE
```

**Алгоритми підпису:**  

* **RSA (RSASSA-PSS)**  
  - Функція хешування: SHA-256  
  - MGF: MGF1 із SHA-256  
  - Довжина випадкової домішки (солі): 32 байти
  - Вимагана довжина ключа: Мінімум 2048 біт.
  
  Рядок для підпису спочатку хешується алгоритмом SHA-256, а потім генерується підпис згідно зі схемою RSASSA-PSS.  

* **ECDSA (P-256/SHA-256)**  
  Рядок для підпису хешується алгоритмом SHA-256, а потім генерується підпис із використанням приватного ключа ECDSA, заснованого на кривій NIST P-256 (secp256r1), вибір якої слід вказати під час генерування CSR.  

  Значення підпису — це пара цілих чисел (r, s). Може бути закодоване в одному з двох форматів:  
  - **IEEE P1363 Fixed Field Concatenation** – **рекомендований спосіб** з огляду на коротший результуючий рядок і сталу довжину. Формат простіший і коротший за DER. Підпис — це конкатенація R || S (по 32 байти big-endian).  
  - **ASN.1 DER SEQUENCE (RFC 3279)** – підпис кодується як ASN.1 DER. Розмір підпису змінний. Пропонуємо використовувати цей тип підпису лише коли IEEE P1363 неможливий через технологічні обмеження.  

В обох випадках (незалежно від вибору RSA чи ESDSA) отримане значення підпису слід закодувати у форматі Base64URL.


Наприклад, для рахунку-фактури:
- тип ідентифікатора контексту входу в систему: "Nip",
- значення ідентифікатора контексту: "1111111111",
- ПДВ номер продавця: "1111111111",
- серійний номер сертифікату KSeF видавця: "01F20A5D352AE590",
- хеш SHA-256 у форматі Base64URL: "UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE",
- підпису посилання з використанням приватного ключа сертифікату KSeF видавця: "mSkm_XmM9fq7PgAJwiL32L9ujhyguOEV48cDB0ncemD2r9TMGa3lr0iRoFk588agCi8QPsOuscUY1rZ7ff76STbGquO-gZtQys5_fHdf2HUfDqPqVTnUS6HknBu0zLkyf9ygoW7WbH06Ty_8BgQTlOmJFzNWSt9WZa7tAGuAE9JOooNps-KG2PYkkIP4q4jPMp3FKypAygHVnXtS0RDGgOxhhM7LWtFP7D-dWINbh5yXD8Lr-JVbeOpyQjHa6WmMYavCDQJ3X_Z-iS01LZu2s1B3xuOykl1h0sLObCdADrbxOONsXrvQa61Xt_rxyprVraj2Uf9pANQgR4-12HEcMw"

Згенероване посилання виглядає наступним чином:

```
https://qr-test.ksef.mf.gov.pl/certificate/Nip/1111111111/1111111111/01F20A5D352AE590/UtQp9Gpc51y-u3xApZjIjgkpZ01js-J8KflSPW8WzIE/mSkm_XmM9fq7PgAJwiL32L9ujhyguOEV48cDB0ncemD2r9TMGa3lr0iRoFk588agCi8QPsOuscUY1rZ7ff76STbGquO-gZtQys5_fHdf2HUfDqPqVTnUS6HknBu0zLkyf9ygoW7WbH06Ty_8BgQTlOmJFzNWSt9WZa7tAGuAE9JOooNps-KG2PYkkIP4q4jPMp3FKypAygHVnXtS0RDGgOxhhM7LWtFP7D-dWINbh5yXD8Lr-JVbeOpyQjHa6WmMYavCDQJ3X_Z-iS01LZu2s1B3xuOykl1h0sLObCdADrbxOONsXrvQa61Xt_rxyprVraj2Uf9pANQgR4-12HEcMw
```

Приклад мовою ```C#```:
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

Приклад мовою Java:
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

#### Генерування QR коду
Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
byte[] qrBytes = qrCodeService.GenerateQrCode(url, PixelsPerModule);
```

Приклад мовою Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.generateQrCode(invoiceForOnlineUrl);
```

#### Позначення під кодом QR

Під кодом QR повинен знаходитись підпис **CERTYFIKAT**, що вказує на функцію верифікації сертифікату KSeF.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\QrCode\QrCodeE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/QrCode/QrCodeE2ETests.cs)

```csharp
private const string GeneratedQrCodeLabel = "CERTYFIKAT";
byte[] labeled = qrCodeService.AddLabelToQrCode(qrBytes, GeneratedQrCodeLabel);
```

Приклад мовою Java:
[QrCodeOnlineIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/QrCodeOnlineIntegrationTest.java)

```java
byte[] qrOnline = qrCodeService.addLabelToQrCode(qrOnline, invoiceKsefNumber);
```

![QR  Certyfikat](qr/qr-cert.png)
