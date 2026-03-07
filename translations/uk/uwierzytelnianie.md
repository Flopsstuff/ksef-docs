---
original: uwierzytelnianie.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [uwierzytelnianie.md](https://github.com/CIRFMF/ksef-docs/blob/main/uwierzytelnianie.md)

## Автентифікація
10.07.2025

## Вступ
Автентифікація в системі KSeF API 2.0 є обов'язковим етапом, який необхідно виконати перед доступом до захищених ресурсів системи. Цей процес базується на **отриманні токена доступу** (```accessToken```) у форматі ```JWT```, який потім використовується для авторизації операцій API.

Процес автентифікації базується на двох елементах:
* Контекст логування – визначає суб'єкт, від імені якого виконуватимуться операції в системі, наприклад, компанію, ідентифіковану номером NIP.
* Суб'єкт автентифікації – вказує, хто намагається автентифікуватися. Спосіб передачі цієї інформації залежить від обраного методу автентифікації.

**Доступні методи автентифікації:**
* **З використанням підпису XAdES** <br>
Надсилається XML-документ (```AuthTokenRequest```), що містить цифровий підпис у форматі XAdES. Інформація про суб'єкт автентифікації зчитується з сертифіката, використаного для підпису (наприклад, NIP, PESEL або відбиток сертифіката).
* **За допомогою токена KSeF** <br>
Надсилається JSON-документ, що містить раніше отриманий системний токен (так званий [токен KSeF](tokeny-ksef.md)). 
Інформація про суб'єкт автентифікації зчитується на основі переданого [токена KSeF](tokeny-ksef.md).

Суб'єкт автентифікації підлягає перевірці – система перевірить, чи має зазначений суб'єкт принаймні одне активне повноваження до обраного контексту. Відсутність таких повноважень унеможливлює отримання токена доступу та користування API.

Отриманий токен діє лише протягом визначеного часу і може оновлюватися без повторного процесу автентифікації.
Токени автоматично анулюються в разі втрати повноважень.

## Процес автентифікації

> **Швидкий старт (демо)**
>
> З метою демонстрації повного ходу процесу автентифікації (отримання виклику, підготовка та підписання XAdES, надсилання, перевірка статусу, отримання токенів `accessToken` і `refreshToken`) можна скористатися демонстраційною програмою. Деталі знаходяться в документі: **[Тестові сертифікати та підписи XAdES](auth/testowe-certyfikaty-i-podpisy-xades.md)**.
>
> **Увага:** самопідписані сертифікати допустимі виключно в тестовому середовищі.

### 1. Отримання auth challenge

Процес автентифікації починається з отримання так званого **auth challenge**, який є елементом, необхідним для подальшого створення запиту автентифікації.
Challenge отримується за допомогою виклику:<br>
POST [/auth/challenge](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1challenge/post)<br>

Час життя challenge становить 10 хвилин.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp

AuthChallengeResponse challenge = await KsefClient.GetAuthChallengeAsync();
```

Приклад мовою ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthenticationChallengeResponse challenge = ksefClient.getAuthChallenge();
```
Відповідь повертає challenge та timestamp.

### 2. Вибір методу підтвердження особи

### 2.1. Автентифікація **кваліфікованим електронним підписом**

#### 1. Підготовка XML-документа (AuthTokenRequest)

Після отримання auth challenge необхідно підготувати XML-документ відповідно до схеми [AuthTokenRequest](https://api-test.ksef.mf.gov.pl/docs/v2/schemas/authv2.xsd), який буде використаний у подальшому процесі автентифікації. Документ містить:


|    Ключ     |           Значення                                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Challenge    | `Значення, отримане з виклику POST [/auth/challenge](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1challenge/post)`                                                                                                          |
| ContextIdentifier| `Ідентифікатор контексту, для якого здійснюється автентифікація (NIP, внутрішній ідентифікатор, складений ідентифікатор VAT ЄС)`                                                                       |
| SubjectIdentifierType | `Спосіб ідентифікації суб'єкта автентифікації. Можливі значення: certificateSubject (наприклад, NIP/PESEL з сертифіката) або certificateFingerprint (відбиток сертифіката).` |    
|(опціонально) AuthorizationPolicy | `Авторизаційні правила. Наразі підтримується список дозволених IP-адрес клієнта.` |    
 

 Приклади XML-документів:
 * SubjectIdentifierType з [certificateSubject](auth/subject-identifier-type-certificate-subject.md)
 * SubjectIdentifierType з [certificateFingerprint](auth/subject-identifier-type-certificate-fingerprint.md)
 * ContextIdentifier з [NIP](auth/context-identifier-nip.md)
 * ContextIdentifier з [InternalId](auth/context-identifier-internal-id.md)
 * ContextIdentifier з [NipVatUe](auth/context-identifier-nip-vat-ue.md)

 На наступному кроці документ буде підписаний з використанням сертифіката суб'єкта.

 **Приклади реалізації:** <br>

| `ContextIdentifier`                                    | `SubjectIdentifierType`                                       | Значення                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Type: nip`<br>`Value: 1234567890` | `certificateSubject`<br>` (NIP 1234567890 в сертифікаті)`    | Автентифікація стосується компанії з NIP 1234567890. Підпис буде складено сертифікатом, що містить у полі 2.5.4.97 NIP 1234567890.                                                       |
| `Type: nip`<br>`Value: 1234567890` | `certificateSubject`<br>` (pesel 88102341294 в сертифікаті)` | Автентифікація стосується компанії з NIP 1234567890. Підпис буде складено сертифікатом фізичної особи, що містить у полі 2.5.4.5 номер PESEL 88102341294. Система KSeF перевірить, чи має ця особа **повноваження діяти** від імені компанії (наприклад, на основі заяви ZAW-FA). |
| `Type: nip`<br>`Value: 1234567890` | `certificateFingerprint:`<br>` (відбиток сертифіката  70a992150f837d5b4d8c8a1c5269cef62cf500bd)` | Автентифікація стосується компанії з NIP 1234567890. Підпис буде складено сертифікатом з відбитком 70a992150f837d5b4d8c8a1c5269cef62cf500bd, на який надано **повноваження діяти** від імені компанії (наприклад, на основі заяви ZAW-FA). |

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Authorization\AuthorizationE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Authorization/AuthorizationE2ETests.cs)

```csharp
AuthenticationTokenAuthorizationPolicy authorizationPolicy = 
    new AuthenticationTokenAuthorizationPolicy
    {
        AllowedIps = new AuthenticationTokenAllowedIps
        {
            Ip4Addresses = ["192.168.0.1", "192.222.111.1"],
            Ip4Masks = ["192.168.1.0/24"], // Приклад маски
            Ip4Ranges = ["222.111.0.1-222.111.0.255"] // Приклад діапазону IP
        }
    };

AuthenticationTokenRequest authTokenRequest = AuthTokenRequestBuilder
    .Create()
    .WithChallenge(challengeResponse.Challenge)
    .WithContext(AuthenticationTokenContextIdentifierType.Nip, ownerNip)
    .WithIdentifierType(AuthenticationTokenSubjectIdentifierTypeEnum.CertificateSubject)
    .WithAuthorizationPolicy(authorizationPolicy)
    .Build();
```

Приклад мовою ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthTokenRequest authTokenRequest = new AuthTokenRequestBuilder()
        .withChallenge(challenge.getChallenge())
        .withContextNip(context)
        .withSubjectType(SubjectIdentifierTypeEnum.CERTIFICATE_SUBJECT)
        .withAuthorizationPolicy(authorizationPolicy)
        .build();
```

#### 2. Підписання документа (XAdES)

Після підготовки документа ```AuthTokenRequest``` необхідно підписати його цифрово у форматі XAdES (XML Advanced Electronic Signatures). Це обов'язковий формат підпису для процесу автентифікації. Для підписання документа можна використовувати:
* Кваліфікований сертифікат фізичної особи – що містить номер PESEL або NIP особи, яка має повноваження діяти від імені компанії,
* Кваліфікований сертифікат організації (так звана корпоративна печатка) - що містить номер NIP.
* Довірчий профіль (ePUAP) – дозволяє підписати документ; використовується фізичними особами, які можуть скласти його через [gov.pl](https://www.gov.pl/web/gov/podpisz-dokument-elektronicznie-wykorzystaj-podpis-zaufany).
* [Сертифікат KSeF](certyfikaty-KSeF.md) – видається системою KSeF. Цей сертифікат не є кваліфікованим сертифікатом, але приймається в процесі автентифікації. Сертифікат KSeF використовується виключно для потреб системи KSeF.
* Сертифікат постачальника послуг Peppol - що містить ідентифікатор постачальника.

У тестовому середовищі допускається використання самостійно згенерованого сертифіката, який є еквівалентом кваліфікованих сертифікатів, що дозволяє зручне тестування підпису без необхідності мати кваліфікований сертифікат.

Бібліотека KSeF Client ([csharp]((https://github.com/CIRFMF/ksef-client-csharp)), [java]((https://github.com/CIRFMF/ksef-client-java))) має функціональність складання цифрового підпису у форматі XAdES.

Після підписання XML-документ має бути переданий до системи KSeF для отримання тимчасового токена (```authenticationToken```).

Детальна інформація про підтримувані формати підпису XAdES та вимоги до атрибутів кваліфікованих сертифікатів знаходиться [тут](auth/podpis-xades.md).

Приклад мовою ```C#```:

Генерація тестового сертифіката (можливого для використання тільки в тестовому середовищі) фізичної особи з приkladowymi ідентифікаторами:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
X509Certificate2 ownerCertificate = CertificateUtils.GetPersonalCertificate("Jan", "Kowalski", "TINPL", ownerNip, "M B");

//CertificateUtils.GetPersonalCertificate
public static X509Certificate2 GetPersonalCertificate(
    string givenName,
    string surname,
    string serialNumberPrefix,
    string serialNumber,
    string commonName,
    EncryptionMethodEnum encryptionType = EncryptionMethodEnum.Rsa)
{
    X509Certificate2 certificate = SelfSignedCertificateForSignatureBuilder
                .Create()
                .WithGivenName(givenName)
                .WithSurname(surname)
                .WithSerialNumber($"{serialNumberPrefix}-{serialNumber}")
                .WithCommonName(commonName)
                .AndEncryptionType(encryptionType)
                .Build();
    return certificate;
}
```
Генерація тестового сертифіката (можливого для використання тільки в тестовому середовищі) організації з приkladowими ідентифікаторами:

```csharp
// Еквівалент кваліфікованого сертифіката організації (так звана корпоративна печатка)
X509Certificate2 euEntitySealCertificate = CertificateUtils.GetCompanySeal("Kowalski sp. z o.o", euEntityNipVatEu, "Kowalski");

//CertificateUtils.GetCompanySeal
public static X509Certificate2 GetCompanySeal(
    string organizationName,
    string organizationIdentifier,
    string commonName)
{
    X509Certificate2 certificate = SelfSignedCertificateForSealBuilder
                .Create()
                .WithOrganizationName(organizationName)
                .WithOrganizationIdentifier(organizationIdentifier)
                .WithCommonName(commonName)
                .Build();
    return certificate;
}
```

Використовуючи ```ISignatureService``` та маючи сертифікат з приватним ключем для підписання документа:

Приклад мовою ```C#```:

[KSeF.Client.Tests.Utils\AuthenticationUtils.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Utils/AuthenticationUtils.cs)

```csharp
string unsignedXml = AuthenticationTokenRequestSerializer.SerializeToXmlString(authTokenRequest);

string signedXml = signatureService.Sign(unsignedXml, certificate);
```

Приклад мовою ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

Генерація тестового сертифіката (можливого для використання тільки в тестовому середовищі) організації з приkladowими ідентифікаторами

Для організації

```java
SelfSignedCertificate cert = certificateService.getCompanySeal("Kowalski sp. z o.o", "VATPL-" + subject, "Kowalski", encryptionMethod);
```

Або для приватної особи

```java
SelfSignedCertificate cert = certificateService.getPersonalCertificate("M", "B", "TINPL", ownerNip,"M B",encryptionMethod);
```

Використовуючи SignatureService та маючи сертифікат з приватним ключем можна підписати документ

```java
String xml = AuthTokenRequestSerializer.authTokenRequestSerializer(authTokenRequest);

String signedXml = signatureService.sign(xml.getBytes(), cert.certificate(), cert.getPrivateKey());
```

#### 3. Надсилання підписаного XML

Після підписання документа AuthTokenRequest необхідно передати його до системи KSeF за допомогою виклику endpoint'а <br>
POST [/auth/xades-signature](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1xades-signature/post). <br>
Оскільки процес автентифікації є асинхронним, у відповіді повертається тимчасовий токен операції автентифікації (JWT) (```authenticationToken```) разом з референтним номером (```referenceNumber```). Обидва ідентифікатори служать для:
* перевірки статусу процесу автентифікації,
* отримання відповідного токена доступу (`accessToken`) у форматі JWT.


Приклад мовою ```C#```:

```csharp
SignatureResponse authOperationInfo = await ksefClient.SubmitXadesAuthRequestAsync(signedXml, verifyCertificateChain: false);
```

Приклад мовою ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
SignatureResponse submitAuthTokenResponse = ksefClient.submitAuthTokenRequest(signedXml, false);
```

### 2.2. Автентифікація **токеном KSeF**
Варіант автентифікації токеном KSeF вимагає надсилання **зашифрованого рядка**, складеного з токена KSeF та часової мітки, отриманої в challenge. Токен є власне секретом автентифікації, тоді як часова мітка виконує роль nonce (IV), забезпечуючи свіжість операції та унеможливлюючи відтворення шифрограми в наступних сесіях.

#### 1. Підготовка та шифрування токена
Рядок символів у форматі:
```csharp
{tokenKSeF}|{timestampMs}
```
Де:
- `tokenKSeF` - токен KSeF,
- `timestampMs` – часова мітка з відповіді на `POST /auth/challenge`, передана як **кількість мілісекунд з 1 січня 1970 року (Unix timestamp, ms)**.

необхідно зашифрувати публічним ключем KSeF, використовуючи алгоритм ```RSA-OAEP``` з функцією хешування ```SHA-256 (MGF1)```. Отриману шифрограму необхідно закодувати в ```Base64```.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthChallengeResponse challenge = await KsefClient.GetAuthChallengeAsync();
long timestampMs = challenge.Timestamp.ToUnixTimeMilliseconds();

// Підготуй "token|timestamp" і зашифруй RSA-OAEP SHA-256 відповідно до вимог API
string tokenWithTimestamp = $"{ksefToken}|{timestampMs}";
byte[] tokenBytes = System.Text.Encoding.UTF8.GetBytes(tokenWithTimestamp);
byte[] encrypted = CryptographyService.EncryptKsefTokenWithRSAUsingPublicKey(tokenBytes);
string encryptedTokenB64 = Convert.ToBase64String(encrypted);
```

Приклад мовою ```Java```:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
AuthenticationChallengeResponse challenge = ksefClient.getAuthChallenge();
byte[] encryptedToken = switch (encryptionMethod) {
    case Rsa -> defaultCryptographyService
            .encryptKsefTokenWithRSAUsingPublicKey(ksefToken.getToken(), challenge.getTimestamp());
    case ECDsa -> defaultCryptographyService
            .encryptKsefTokenWithECDsaUsingPublicKey(ksefToken.getToken(), challenge.getTimestamp());
};
```

#### 2. Надсилання запиту автентифікації [токеном KSeF](tokeny-ksef.md)
Зашифрований токен Ksef необхідно надіслати разом з

|    Ключ     |           Значення                                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Challenge    | `Значення, отримане з виклику /auth/challenge`                                                                                                          |
| Context| `Ідентифікатор контексту, для якого здійснюється автентифікація (NIP, внутрішній ідентифікатор, складений ідентифікатор VAT ЄС)`                                                                       |
| (опціонально) AuthorizationPolicy | `Правила щодо валідації IP-адреси клієнта під час користування виданим токеном доступу (accessToken).` |  

за допомогою виклику endpoint'а:

POST [/auth/ksef-token](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1ksef-token/post). <br>

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
// Спосіб 1: Побудова запиту за допомогою builder'а
IAuthKsefTokenRequestBuilderWithEncryptedToken builder = AuthKsefTokenRequestBuilder
    .Create()
    .WithChallenge(challenge)
    .WithContext(contextIdentifierType, contextIdentifierValue)
    .WithEncryptedToken(encryptedToken);   
AuthenticationKsefTokenRequest authKsefTokenRequest = builder.Build();

// Спосіб 2: ручне створення об'єкта
AuthenticationKsefTokenRequest request = new AuthenticationKsefTokenRequest
{
    Challenge = challenge.Challenge,
    ContextIdentifier = new AuthenticationTokenContextIdentifier
    {
        Type = AuthenticationTokenContextIdentifierType.Nip,
        Value = nip
    },
    EncryptedToken = encryptedTokenB64,
    AuthorizationPolicy = null
};

SignatureResponse signature = await KsefClient.SubmitKsefTokenAuthRequestAsync(request, CancellationToken);
```

Приклад мовою ```Java```:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
 AuthKsefTokenRequest authTokenRequest = new AuthKsefTokenRequestBuilder()
        .withChallenge(challenge.getChallenge())
        .withContextIdentifier(new ContextIdentifier(ContextIdentifier.IdentifierType.NIP, contextNip))
        .withEncryptedToken(Base64.getEncoder().encodeToString(encryptedToken))
        .build();

SignatureResponse response = ksefClient.authenticateByKSeFToken(authTokenRequest);
```

Оскільки процес автентифікації є асинхронним, у відповіді повертається тимчасовий операційний токен (```authenticationToken```) разом з референтним номером (```referenceNumber```). Обидва ідентифікатори служать для:
* перевірки статусу процесу автентифікації,
* отримання відповідного токена доступу (accessToken) у форматі JWT.

### 3. Перевірка статусу автентифікації

Після надсилання підписаного XML-документа (```AuthTokenRequest```) та отримання відповіді, що містить ```authenticationToken``` та ```referenceNumber```, необхідно перевірити статус поточної операції автентифікації, подавши в заголовку ```Authorization``` Bearer \<authenticationToken\>. <br>
GET [/auth/{referenceNumber}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1%7BreferenceNumber%7D/get)
У відповіді повертається статус – код і опис стану операції (наприклад, "Автентифікація в ході", "Автентифікація завершена успішно").

**Увага**  
У передпродакційному та продакційному середовищах система, окрім правильності підпису XAdES, перевіряє актуальний статус сертифіката у його видавця (служби OCSP/CRL). До моменту отримання обов'язкової відповіді від постачальника сертифіката статус операції повертатиме "Автентифікація в ході" - це нормальний наслідок процесу верифікації і не означає помилку системи. Перевірка статусу є асинхронною; результат слід запитувати до успіху. Час верифікації залежить від видавця сертифіката.

**Рекомендація для продакційного середовища - сертифікат KSeF**  
Щоб уникнути очікування на верифікацію статусу сертифіката в службах OCSP/CRL з боку кваліфікованих постачальників довірчих послуг, рекомендується автентифікація [сертифікатом KSeF](certyfikaty-KSeF.md). Верифікація сертифіката KSeF відбувається всередині системи і відбувається негайно після отримання підпису.

**Обробка помилок**  
У разі невдачі у відповіді можуть з'явитися коди помилок, пов'язані з неправильним підписом, відсутністю повноважень або технічними проблемами. Детальний список кодів помилок буде доступний у технічній документації endpoint'а.

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthStatus status = await KsefClient.GetAuthStatusAsync(signature.ReferenceNumber, signature.AuthenticationToken.Token);
```

Приклад мовою ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthStatus authStatus = ksefClient.getAuthStatus(referenceNumber, tempToken);
```

### 4. Отримання токена доступу (accessToken)
Endpoint повертає одноразово пару токенів, згенерованих для успішно завершеного процесу автентифікації. Кожен наступний виклик з тим самим ```authenticationToken``` поверне помилку 400.

POST [/auth/token/redeem](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1token~1redeem/post)

Приклад мовою ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthOperationStatusResponse tokens = await KsefClient.GetAccessTokenAsync(signature.AuthenticationToken.Token);
```

Приклад мовою ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthOperationStatusResponse tokenResponse = ksefClient.redeemToken(response.getAuthenticationToken().getToken());
```

У відповіді повертаються:
* ```accessToken``` – токен доступу JWT для авторизації операцій в API (в заголовку Authorization: Bearer ...), має обмежений час дії (наприклад, кілька хвилин, визначений у полі exp),
* ```refreshToken``` – токен, що дозволяє оновлювати ```accessToken``` без повторної автентифікації, має значно довший період дії (до 7 днів) і може використовуватися багаторазово для оновлення токена доступу.

**Увага!**
1. ```accessToken``` та ```refreshToken``` слід розглядати як конфіденційні дані – їх зберігання вимагає відповідних заходів безпеки.
2. Токен доступу (`accessToken`) залишається дійсним до закінчення дати, визначеної у полі `exp`, навіть якщо повноваження користувача зміняться.

#### 5. Оновлення токена доступу (```accessToken```)
З метою підтримання безперервного доступу до захищених ресурсів API система KSeF надає механізм оновлення токена доступу (```accessToken```) за допомогою спеціального токена оновлення (```refreshToken```). Це рішення усуває необхідність кожного разу повторювати повний процес автентифікації, а також покращує безпеку системи – короткий час життя ```accessToken``` обмежує ризик його неавторизованого використання в разі перехоплення.

POST [/auth/token/refresh](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1token~1refresh/post) <br>
```RefreshToken``` необхідно передавати в заголовку Authorization у форматі:
```
Authorization: Bearer {refreshToken}
```

Відповідь містить новий ```accessToken``` (JWT) з актуальним набором повноважень і ролей.

 Приклад мовою ```C#```:

```csharp
RefreshTokenResponse refreshedAccessTokenResponse = await ksefClient.RefreshAccessTokenAsync(accessTokenResult.RefreshToken.Token);
```

Приклад мовою ```Java```:
[AuthorizationIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/AuthorizationIntegrationTest.java)

```java
AuthenticationTokenRefreshResponse refreshTokenResult = ksefClient.refreshAccessToken(initialRefreshToken);
```

#### 6. Управління сесіями автентифікації 
Детальна інформація про управління активними сесіями автентифікації знаходиться в документі [Управління сесіями](auth/sesje.md).

Пов'язані документи: 
- [Сертифікати KSeF](certyfikaty-KSeF.md)
- [Тестові сертифікати та підписи XAdES](auth/testowe-certyfikaty-i-podpisy-xades.md)
- [Підпис XAdES](auth/podpis-xades.md)
- [Токен KSeF](tokeny-ksef.md)

Пов'язані тести:
- [Автентифікація E2E](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests/Features/Authenticate/Authenticate.feature.cs)
