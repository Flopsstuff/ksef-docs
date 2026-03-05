---
original: uwierzytelnianie.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [uwierzytelnianie.md](https://github.com/CIRFMF/ksef-docs/blob/main/uwierzytelnianie.md)

## Аутентификация
10.07.2025

## Введение
Аутентификация в системе KSeF API 2.0 является обязательным этапом, который необходимо выполнить перед доступом к защищенным ресурсам системы. Данный процесс основан на **получении токена доступа** (```accessToken```) в формате ```JWT```, который затем используется для авторизации операций API.

Процесс аутентификации основан на двух элементах:
* Контекст входа – определяет субъект, от имени которого будут выполняться операции в системе, например, компанию, идентифицируемую по номеру NIP.
* Аутентифицирующий субъект – указывает, кто предпринимает попытку аутентификации. Способ передачи этой информации зависит от выбранного метода аутентификации.

**Доступные методы аутентификации:**
* **С использованием подписи XAdES** <br>
Отправляется XML-документ (```AuthTokenRequest```), содержащий цифровую подпись в формате XAdES. Информация об аутентифицирующем субъекте считывается из сертификата, используемого для подписи (например, NIP, PESEL или отпечаток сертификата).
* **С помощью токена KSeF** <br>
Отправляется JSON-документ, содержащий ранее полученный системный токен (так называемый [токен KSeF](tokeny-ksef.md)). 
Информация об аутентифицирующем субъекте считывается на основе переданного [токена KSeF](tokeny-ksef.md).

Аутентифицирующий субъект подлежит верификации – система проверит, обладает ли указанный субъект как минимум одним активным разрешением для выбранного контекста. Отсутствие таких разрешений делает невозможным получение токена доступа и использование API.

Полученный токен действителен только в течение определенного времени и может быть обновлен без повторного процесса аутентификации.
Токены автоматически аннулируются в случае утраты разрешений.

## Процесс аутентификации

> **Быстрый старт (демо)**
>
> Для демонстрации полного хода процесса аутентификации (получение вызова, подготовка и подпись XAdES, отправка, проверка статуса, получение токенов `accessToken` и `refreshToken`) можно воспользоваться демонстрационным приложением. Подробности находятся в документе: **[Тестовые сертификаты и подписи XAdES](auth/testowe-certyfikaty-i-podpisy-xades.md)**.
>
> **Внимание:** самоподписанные сертификаты допустимы исключительно в тестовой среде.

### 1. Получение auth challenge

Процесс аутентификации начинается с получения так называемого **auth challenge**, который является элементом, необходимым для дальнейшего создания запроса аутентификации.
Challenge получается с помощью вызова:<br>
POST [/auth/challenge](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1challenge/post)<br>

Время жизни challenge составляет 10 минут.

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp

AuthChallengeResponse challenge = await KsefClient.GetAuthChallengeAsync();
```

Пример на языке ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthenticationChallengeResponse challenge = ksefClient.getAuthChallenge();
```
Ответ возвращает challenge и timestamp.

### 2. Выбор метода подтверждения личности

### 2.1. Аутентификация **квалифицированной электронной подписью**

#### 1. Подготовка XML-документа (AuthTokenRequest)

После получения auth challenge необходимо подготовить XML-документ в соответствии со схемой [AuthTokenRequest](https://api-test.ksef.mf.gov.pl/docs/v2/schemas/authv2.xsd), который будет использован в дальнейшем процессе аутентификации. Данный документ содержит:


|    Ключ     |           Значение                                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Challenge    | `Значение, полученное из вызова POST [/auth/challenge](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1challenge/post)`                                                                                                          |
| ContextIdentifier| `Идентификатор контекста, для которого выполняется аутентификация (NIP, внутренний идентификатор, составной идентификатор VAT UE)`                                                                       |
| SubjectIdentifierType | `Способ идентификации аутентифицирующегося субъекта. Возможные значения: certificateSubject (например, NIP/PESEL из сертификата) или certificateFingerprint (отпечаток пальца сертификата).` |    
|(необязательно) AuthorizationPolicy | `Правила авторизации. В настоящее время поддерживается список разрешенных IP-адресов клиента.` |    
 

 Примерные XML-документы:
 * SubjectIdentifierType с [certificateSubject](auth/subject-identifier-type-certificate-subject.md)
 * SubjectIdentifierType с [certificateFingerprint](auth/subject-identifier-type-certificate-fingerprint.md)
 * ContextIdentifier с [NIP](auth/context-identifier-nip.md)
 * ContextIdentifier с [InternalId](auth/context-identifier-internal-id.md)
 * ContextIdentifier с [NipVatUe](auth/context-identifier-nip-vat-ue.md)

 На следующем этапе документ будет подписан с использованием сертификата субъекта.

 **Примеры реализации:** <br>

| `ContextIdentifier`                                    | `SubjectIdentifierType`                                       | Значение                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Type: nip`<br>`Value: 1234567890` | `certificateSubject`<br>` (NIP 1234567890 в сертификате)`    | Аутентификация касается компании с NIP 1234567890. Подпись будет сделана сертификатом, содержащим в поле 2.5.4.97 NIP 1234567890.                                                       |
| `Type: nip`<br>`Value: 1234567890` | `certificateSubject`<br>` (pesel 88102341294 в сертификате)` | Аутентификация касается компании с NIP 1234567890. Подпись будет сделана сертификатом физического лица, содержащим в поле 2.5.4.5 номер PESEL 88102341294. Система KSeF проверит, обладает ли это лицо **разрешениями на действие** от имени компании (например, на основе заявления ZAW-FA). |
| `Type: nip`<br>`Value: 1234567890` | `certificateFingerprint:`<br>` (отпечаток сертификата  70a992150f837d5b4d8c8a1c5269cef62cf500bd)` | Аутентификация касается компании с NIP 1234567890. Подпись будет сделана сертификатом с отпечатком 70a992150f837d5b4d8c8a1c5269cef62cf500bd, на который предоставлены **разрешения на действие** от имени компании (например, на основе заявления ZAW-FA). |

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Authorization\AuthorizationE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Authorization/AuthorizationE2ETests.cs)

```csharp
AuthenticationTokenAuthorizationPolicy authorizationPolicy = 
    new AuthenticationTokenAuthorizationPolicy
    {
        AllowedIps = new AuthenticationTokenAllowedIps
        {
            Ip4Addresses = ["192.168.0.1", "192.222.111.1"],
            Ip4Masks = ["192.168.1.0/24"], // Примерная маска
            Ip4Ranges = ["222.111.0.1-222.111.0.255"] // Примерный диапазон IP
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

Пример на языке ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthTokenRequest authTokenRequest = new AuthTokenRequestBuilder()
        .withChallenge(challenge.getChallenge())
        .withContextNip(context)
        .withSubjectType(SubjectIdentifierTypeEnum.CERTIFICATE_SUBJECT)
        .withAuthorizationPolicy(authorizationPolicy)
        .build();
```

#### 2. Подпись документа (XAdES)

После подготовки документа ```AuthTokenRequest``` необходимо подписать его цифровой подписью в формате XAdES (XML Advanced Electronic Signatures). Это требуемый формат подписи для процесса аутентификации. Для подписи документа можно использовать:
* Квалифицированный сертификат физического лица – содержащий номер PESEL или NIP лица, обладающего разрешениями действовать от имени компании,
* Квалифицированный сертификат организации (так называемая корпоративная печать) - содержащий номер NIP.
* Доверенный профиль (ePUAP) – позволяет подписать документ; используется физическими лицами, которые могут сделать это через [gov.pl](https://www.gov.pl/web/gov/podpisz-dokument-elektronicznie-wykorzystaj-podpis-zaufany).
* [Сертификат KSeF](certyfikaty-KSeF.md) – выдаваемый системой KSeF. Данный сертификат не является квалифицированным сертификатом, но принимается в процессе аутентификации. Сертификат KSeF используется исключительно для нужд системы KSeF.
* Сертификат поставщика услуг Peppol - содержащий идентификатор поставщика.

В тестовой среде допускается использование самостоятельно сгенерированного сертификата, являющегося эквивалентом квалифицированных сертификатов, что позволяет удобно тестировать подпись без необходимости обладания квалифицированным сертификатом.

Библиотека KSeF Client ([csharp]((https://github.com/CIRFMF/ksef-client-csharp)), [java]((https://github.com/CIRFMF/ksef-client-java))) обладает функциональностью создания цифровой подписи в формате XAdES.

После подписи XML-документ должен быть отправлен в систему KSeF для получения временного токена (```authenticationToken```).

Подробная информация о поддерживаемых форматах подписи XAdES и требованиях к атрибутам квалифицированных сертификатов находится [здесь](auth/podpis-xades.md).

Пример на языке ```C#```:

Генерация тестового сертификата (возможного к использованию только в тестовой среде) физического лица с примерными идентификаторами:
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
Генерация тестового сертификата (возможного к использованию только в тестовой среде) организации с примерными идентификаторами:

```csharp
// Эквивалент квалифицированного сертификата организации (так называемая корпоративная печать)
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

Используя ```ISignatureService``` и имея сертификат с приватным ключом для подписи документа:

Пример на языке ```C#```:

[KSeF.Client.Tests.Utils\AuthenticationUtils.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Utils/AuthenticationUtils.cs)

```csharp
string unsignedXml = AuthenticationTokenRequestSerializer.SerializeToXmlString(authTokenRequest);

string signedXml = signatureService.Sign(unsignedXml, certificate);
```

Пример на языке ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

Генерация тестового сертификата (возможного к использованию только в тестовой среде) организации с примерными идентификаторами

Для организации

```java
SelfSignedCertificate cert = certificateService.getCompanySeal("Kowalski sp. z o.o", "VATPL-" + subject, "Kowalski", encryptionMethod);
```

Или для частного лица

```java
SelfSignedCertificate cert = certificateService.getPersonalCertificate("M", "B", "TINPL", ownerNip,"M B",encryptionMethod);
```

Используя SignatureService и имея сертификат с приватным ключом можно подписать документ

```java
String xml = AuthTokenRequestSerializer.authTokenRequestSerializer(authTokenRequest);

String signedXml = signatureService.sign(xml.getBytes(), cert.certificate(), cert.getPrivateKey());
```

#### 3. Отправка подписанного XML

После подписи документа AuthTokenRequest необходимо отправить его в систему KSeF с помощью вызова endpoint <br>
POST [/auth/xades-signature](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1xades-signature/post). <br>
Поскольку процесс аутентификации является асинхронным, в ответе возвращается временный токен операции аутентификации (JWT) (```authenticationToken```) вместе с справочным номером (```referenceNumber```). Оба идентификатора служат для:
* проверки статуса процесса аутентификации,
* получения соответствующего токена доступа (`accessToken`) в формате JWT.


Пример на языке ```C#```:

```csharp
SignatureResponse authOperationInfo = await ksefClient.SubmitXadesAuthRequestAsync(signedXml, verifyCertificateChain: false);
```

Пример на языке ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
SignatureResponse submitAuthTokenResponse = ksefClient.submitAuthTokenRequest(signedXml, false);
```

### 2.2. Аутентификация **токеном KSeF**
Вариант аутентификации токеном KSeF требует передачи **зашифрованной строки**, состоящей из токена KSeF и временной метки, полученной в challenge. Токен представляет собой настоящий секрет аутентификации, в то время как временная метка выполняет роль nonce (IV), обеспечивая свежесть операции и делая невозможным воспроизведение шифрограммы в последующих сессиях.

#### 1. Подготовка и шифрование токена
Строка символов в формате:
```csharp
{tokenKSeF}|{timestampMs}
```
Где:
- `tokenKSeF` - токен KSeF,
- `timestampMs` – временная метка из ответа на `POST /auth/challenge`, переданная как **количество миллисекунд с 1 января 1970 года (Unix timestamp, ms)**.

должна быть зашифрована публичным ключом KSeF, используя алгоритм ```RSA-OAEP``` с хеш-функцией ```SHA-256 (MGF1)```. Полученную шифрограмму необходимо закодировать в ```Base64```.

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthChallengeResponse challenge = await KsefClient.GetAuthChallengeAsync();
long timestampMs = challenge.Timestamp.ToUnixTimeMilliseconds();

// Подготовь "token|timestamp" и зашифруй RSA-OAEP SHA-256 согласно требованию API
string tokenWithTimestamp = $"{ksefToken}|{timestampMs}";
byte[] tokenBytes = System.Text.Encoding.UTF8.GetBytes(tokenWithTimestamp);
byte[] encrypted = CryptographyService.EncryptKsefTokenWithRSAUsingPublicKey(tokenBytes);
string encryptedTokenB64 = Convert.ToBase64String(encrypted);
```

Пример на языке ```Java```:
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

#### 2. Отправка запроса аутентификации [токеном KSeF](tokeny-ksef.md)
Зашифрованный токен Ksef необходимо отправить вместе с

|    Ключ     |           Значение                                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Challenge    | `Значение, полученное из вызова /auth/challenge`                                                                                                          |
| Context| `Идентификатор контекста, для которого выполняется аутентификация (NIP, внутренний идентификатор, составной идентификатор VAT UE)`                                                                       |
| (необязательно) AuthorizationPolicy | `Правила валидации IP-адреса клиента при использовании выданного токена доступа (accessToken).` |  

с помощью вызова endpoint:

POST [/auth/ksef-token](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1ksef-token/post). <br>

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
// Способ 1: Построение запроса с помощью builder
IAuthKsefTokenRequestBuilderWithEncryptedToken builder = AuthKsefTokenRequestBuilder
    .Create()
    .WithChallenge(challenge)
    .WithContext(contextIdentifierType, contextIdentifierValue)
    .WithEncryptedToken(encryptedToken);   
AuthenticationKsefTokenRequest authKsefTokenRequest = builder.Build();

// Способ 2: ручное создание объекта
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

Пример на языке ```Java```:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
 AuthKsefTokenRequest authTokenRequest = new AuthKsefTokenRequestBuilder()
        .withChallenge(challenge.getChallenge())
        .withContextIdentifier(new ContextIdentifier(ContextIdentifier.IdentifierType.NIP, contextNip))
        .withEncryptedToken(Base64.getEncoder().encodeToString(encryptedToken))
        .build();

SignatureResponse response = ksefClient.authenticateByKSeFToken(authTokenRequest);
```

Поскольку процесс аутентификации является асинхронным, в ответе возвращается временный операционный токен (```authenticationToken```) вместе с справочным номером (```referenceNumber```). Оба идентификатора служат для:
* проверки статуса процесса аутентификации,
* получения соответствующего токена доступа (accessToken) в формате JWT.

### 3. Проверка статуса аутентификации

После отправки подписанного XML-документа (```AuthTokenRequest```) и получения ответа, содержащего ```authenticationToken``` и ```referenceNumber```, необходимо проверить статус текущей операции аутентификации, указав в заголовке ```Authorization``` Bearer \<authenticationToken\>. <br>
GET [/auth/{referenceNumber}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1%7BreferenceNumber%7D/get)
В ответе возвращается статус – код и описание состояния операции (например, "Аутентификация в процессе", "Аутентификация завершена успешно").

**Внимание**  
В предпродукционной и продукционной средах система, помимо корректности подписи XAdES, проверяет актуальный статус сертификата у его издателя (службы OCSP/CRL). До получения обязывающего ответа от поставщика сертификата статус операции будет возвращать "Аутентификация в процессе" - это нормальное следствие процесса верификации и не означает ошибку системы. Проверка статуса является асинхронной; результат следует запрашивать до успешного завершения. Время верификации зависит от издателя сертификата.

**Рекомендация для продукционной среды - сертификат KSeF**  
Для устранения ожидания верификации статуса сертификата в службах OCSP/CRL со стороны квалифицированных поставщиков доверительных услуг рекомендуется аутентификация [сертификатом KSeF](certyfikaty-KSeF.md). Верификация сертификата KSeF происходит внутри системы и следует немедленно после получения подписи.

**Обработка ошибок**  
В случае неудачи в ответе могут появиться коды ошибок, связанные с неправильной подписью, отсутствием разрешений или техническими проблемами. Подробный список кодов ошибок будет доступен в технической документации endpoint.

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthStatus status = await KsefClient.GetAuthStatusAsync(signature.ReferenceNumber, signature.AuthenticationToken.Token);
```

Пример на языке ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthStatus authStatus = ksefClient.getAuthStatus(referenceNumber, tempToken);
```

### 4. Получение токена доступа (accessToken)
Endpoint возвращает единовременно пару токенов, сгенерированных для успешно завершенного процесса аутентификации. Каждый последующий вызов с тем же ```authenticationToken``` вернет ошибку 400.

POST [/auth/token/redeem](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1token~1redeem/post)

Пример на языке ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthOperationStatusResponse tokens = await KsefClient.GetAccessTokenAsync(signature.AuthenticationToken.Token);
```

Пример на языке ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthOperationStatusResponse tokenResponse = ksefClient.redeemToken(response.getAuthenticationToken().getToken());
```

В ответе возвращаются:
* ```accessToken``` – токен доступа JWT для авторизации операций в API (в заголовке Authorization: Bearer ...), имеет ограниченное время действия (например, несколько минут, определенное в поле exp),
* ```refreshToken``` – токен, позволяющий обновить ```accessToken``` без повторной аутентификации, имеет значительно более длительный период действия (до 7 дней) и может использоваться многократно для обновления токена доступа.

**Внимание!**
1. ```accessToken``` и ```refreshToken``` должен рассматриваться как конфиденциальные данные – их хранение требует соответствующих мер безопасности.
2. Токен доступа (`accessToken`) остается действительным до истечения даты, определенной в поле `exp`, даже если разрешения пользователя изменятся.

#### 5. Обновление токена доступа (```accessToken```)
Для поддержания непрерывного доступа к защищенным ресурсам API система KSeF предоставляет механизм обновления токена доступа (```accessToken```) с использованием специального токена обновления (```refreshToken```). Данное решение исключает необходимость каждый раз повторять полный процесс аутентификации, но также улучшает безопасность системы – короткое время жизни ```accessToken``` ограничивает риск его неавторизованного использования в случае перехвата.

POST [/auth/token/refresh](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1token~1refresh/post) <br>
```RefreshToken``` необходимо передать в заголовке Authorization в формате:
```
Authorization: Bearer {refreshToken}
```

Ответ содержит новый ```accessToken``` (JWT) с актуальным набором разрешений и ролей.

 Пример на языке ```C#```:

```csharp
RefreshTokenResponse refreshedAccessTokenResponse = await ksefClient.RefreshAccessTokenAsync(accessTokenResult.RefreshToken.Token);
```

Пример на языке ```Java```:
[AuthorizationIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/AuthorizationIntegrationTest.java)

```java
AuthenticationTokenRefreshResponse refreshTokenResult = ksefClient.refreshAccessToken(initialRefreshToken);
```

#### 6. Управление сессиями аутентификации 
Подробная информация об управлении активными сессиями аутентификации находится в документе [Управление сессиями](auth/sesje.md).

Связанные документы: 
- [Сертификаты KSeF](certyfikaty-KSeF.md)
- [Тестовые сертификаты и подписи XAdES](auth/testowe-certyfikaty-i-podpisy-xades.md)
- [Подпись XAdES](auth/podpis-xades.md)
- [Токен KSeF](tokeny-ksef.md)

Связанные тесты:
- [Аутентификация E2E](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests/Features/Authenticate/Authenticate.feature.cs)
