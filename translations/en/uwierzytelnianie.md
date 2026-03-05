---
original: uwierzytelnianie.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [uwierzytelnianie.md](https://github.com/CIRFMF/ksef-docs/blob/main/uwierzytelnianie.md)

## Authentication
10.07.2025

## Introduction
Authentication in the KSeF API 2.0 system is a mandatory step that must be performed before accessing protected system resources. This process is based on **obtaining an access token** (```accessToken```) in ```JWT``` format, which is then used to authorize API operations.

The authentication process is based on two elements:
* Login context – defines the entity on whose behalf operations will be performed in the system, e.g., a company identified by its NIP number.
* Authenticating entity – indicates who is attempting authentication. The method of providing this information depends on the chosen authentication method.

**Available authentication methods:**
* **Using XAdES signature** <br>
An XML document (```AuthTokenRequest```) containing a digital signature in XAdES format is sent. Information about the authenticating entity is read from the certificate used for signing (e.g., NIP, PESEL, or certificate fingerprint).
* **Using KSeF token** <br>
A JSON document containing a previously obtained system token (so-called [KSeF token](tokeny-ksef.md)) is sent. 
Information about the authenticating entity is read based on the sent [KSeF token](tokeny-ksef.md).

The authenticating entity is subject to verification – the system will check whether the indicated entity has at least one active permission for the selected context. Lack of such permissions prevents obtaining an access token and using the API.

The obtained token is valid only for a specified time and can be refreshed without repeating the authentication process.
Tokens are automatically invalidated in case of permission loss.

## Authentication Process

> **Quick start (demo)**
>
> To demonstrate the complete authentication process flow (challenge retrieval, XAdES preparation and signing, submission, status checking, retrieval of `accessToken` and `refreshToken` tokens), you can use the demonstration application. Details can be found in the document: **[Test certificates and XAdES signatures](auth/testowe-certyfikaty-i-podpisy-xades.md)**.
>
> **Note:** self-signed certificates are only allowed in the test environment.

### 1. Obtaining auth challenge

The authentication process begins by retrieving the so-called **auth challenge**, which is a required element for creating the subsequent authentication request.
The challenge is retrieved using the call:<br>
POST [/auth/challenge](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1challenge/post)<br>

The challenge lifetime is 10 minutes.

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp

AuthChallengeResponse challenge = await KsefClient.GetAuthChallengeAsync();
```

Example in ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthenticationChallengeResponse challenge = ksefClient.getAuthChallenge();
```
The response returns challenge and timestamp.

### 2. Choosing identity confirmation method

### 2.1. Authentication with **qualified electronic signature**

#### 1. Preparing XML document (AuthTokenRequest)

After obtaining the auth challenge, you need to prepare an XML document compliant with the [AuthTokenRequest](https://api-test.ksef.mf.gov.pl/docs/v2/schemas/authv2.xsd) schema, which will be used in the further authentication process. This document contains:


|    Key     |           Value                                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Challenge    | `Value received from POST [/auth/challenge](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1challenge/post) call`                                                                                                          |
| ContextIdentifier| `Context identifier for which authentication is performed (NIP, internal identifier, EU VAT composite identifier)`                                                                       |
| SubjectIdentifierType | `Method of identifying the authenticating entity. Possible values: certificateSubject (e.g., NIP/PESEL from certificate) or certificateFingerprint (certificate fingerprint).` |    
|(optional) AuthorizationPolicy | `Authorization rules. Currently supported list of allowed client IP addresses.` |    
 

 Example XML documents:
 * SubjectIdentifierType with [certificateSubject](auth/subject-identifier-type-certificate-subject.md)
 * SubjectIdentifierType with [certificateFingerprint](auth/subject-identifier-type-certificate-fingerprint.md)
 * ContextIdentifier with [NIP](auth/context-identifier-nip.md)
 * ContextIdentifier with [InternalId](auth/context-identifier-internal-id.md)
 * ContextIdentifier with [NipVatUe](auth/context-identifier-nip-vat-ue.md)

 In the next step, the document will be signed using the entity's certificate.

 **Implementation examples:** <br>

| `ContextIdentifier`                                    | `SubjectIdentifierType`                                       | Meaning                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Type: nip`<br>`Value: 1234567890` | `certificateSubject`<br>` (NIP 1234567890 in certificate)`    | Authentication concerns company with NIP 1234567890. The signature will be made with a certificate containing NIP 1234567890 in field 2.5.4.97.                                                       |
| `Type: nip`<br>`Value: 1234567890` | `certificateSubject`<br>` (pesel 88102341294 in certificate)` | Authentication concerns company with NIP 1234567890. The signature will be made with a natural person's certificate containing PESEL number 88102341294 in field 2.5.4.5. The KSeF system will check whether this person has **authorization to act** on behalf of the company (e.g., based on ZAW-FA declaration). |
| `Type: nip`<br>`Value: 1234567890` | `certificateFingerprint:`<br>` (certificate fingerprint  70a992150f837d5b4d8c8a1c5269cef62cf500bd)` | Authentication concerns company with NIP 1234567890. The signature will be made with a certificate with fingerprint 70a992150f837d5b4d8c8a1c5269cef62cf500bd for which **authorization to act** on behalf of the company was granted (e.g., based on ZAW-FA declaration). |

Example in C#:
[KSeF.Client.Tests.Core\E2E\Authorization\AuthorizationE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Authorization/AuthorizationE2ETests.cs)

```csharp
AuthenticationTokenAuthorizationPolicy authorizationPolicy = 
    new AuthenticationTokenAuthorizationPolicy
    {
        AllowedIps = new AuthenticationTokenAllowedIps
        {
            Ip4Addresses = ["192.168.0.1", "192.222.111.1"],
            Ip4Masks = ["192.168.1.0/24"], // Example mask
            Ip4Ranges = ["222.111.0.1-222.111.0.255"] // Example IP range
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

Example in ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthTokenRequest authTokenRequest = new AuthTokenRequestBuilder()
        .withChallenge(challenge.getChallenge())
        .withContextNip(context)
        .withSubjectType(SubjectIdentifierTypeEnum.CERTIFICATE_SUBJECT)
        .withAuthorizationPolicy(authorizationPolicy)
        .build();
```

#### 2. Signing the document (XAdES)

After preparing the ```AuthTokenRequest``` document, it must be digitally signed in XAdES (XML Advanced Electronic Signatures) format. This is the required signature format for the authentication process. To sign the document, you can use:
* Qualified certificate of a natural person – containing the PESEL or NIP number of a person authorized to act on behalf of the company,
* Qualified certificate of an organization (so-called company seal) - containing the NIP number.
* Trusted Profile (ePUAP) – enables document signing; used by natural persons who can submit it through [gov.pl](https://www.gov.pl/web/gov/podpisz-dokument-elektronicznie-wykorzystaj-podpis-zaufany).
* [KSeF certificate](certyfikaty-KSeF.md) – issued by the KSeF system. This certificate is not a qualified certificate, but is honored in the authentication process. The KSeF certificate is used exclusively for KSeF system purposes.
* Peppol service provider certificate - containing the provider identifier.

In the test environment, the use of self-generated certificates equivalent to qualified certificates is allowed, enabling convenient signature testing without the need for a qualified certificate.

The KSeF Client library ([csharp]((https://github.com/CIRFMF/ksef-client-csharp)), [java]((https://github.com/CIRFMF/ksef-client-java))) has functionality for creating digital signatures in XAdES format.

After signing the XML document, it should be sent to the KSeF system to obtain a temporary token (```authenticationToken```).

Detailed information about supported XAdES signature formats and requirements for qualified certificate attributes can be found [here](auth/podpis-xades.md).

Example in ```C#```:

Generating test certificate (usable only in test environment) for natural person with example identifiers:
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
Generating test certificate (usable only in test environment) for organization with example identifiers:

```csharp
// Equivalent of qualified organization certificate (so-called company seal)
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

Using ```ISignatureService``` and having a certificate with private key to sign the document:

Example in ```C#```:

[KSeF.Client.Tests.Utils\AuthenticationUtils.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Utils/AuthenticationUtils.cs)

```csharp
string unsignedXml = AuthenticationTokenRequestSerializer.SerializeToXmlString(authTokenRequest);

string signedXml = signatureService.Sign(unsignedXml, certificate);
```

Example in ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

Generating test certificate (usable only in test environment) for organization with example identifiers

For organization

```java
SelfSignedCertificate cert = certificateService.getCompanySeal("Kowalski sp. z o.o", "VATPL-" + subject, "Kowalski", encryptionMethod);
```

Or for private person

```java
SelfSignedCertificate cert = certificateService.getPersonalCertificate("M", "B", "TINPL", ownerNip,"M B",encryptionMethod);
```

Using SignatureService and having a certificate with private key you can sign the document

```java
String xml = AuthTokenRequestSerializer.authTokenRequestSerializer(authTokenRequest);

String signedXml = signatureService.sign(xml.getBytes(), cert.certificate(), cert.getPrivateKey());
```

#### 3. Sending signed XML

After signing the AuthTokenRequest document, it must be sent to the KSeF system using the endpoint call <br>
POST [/auth/xades-signature](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1xades-signature/post). <br>
Since the authentication process is asynchronous, the response returns a temporary authentication operation token (JWT) (```authenticationToken```) along with a reference number (```referenceNumber```). Both identifiers are used to:
* check the status of the authentication process,
* retrieve the proper access token (`accessToken`) in JWT format.


Example in ```C#```:

```csharp
SignatureResponse authOperationInfo = await ksefClient.SubmitXadesAuthRequestAsync(signedXml, verifyCertificateChain: false);
```

Example in ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
SignatureResponse submitAuthTokenResponse = ksefClient.submitAuthTokenRequest(signedXml, false);
```

### 2.2. Authentication with **KSeF token**
The KSeF token authentication variant requires sending an **encrypted string** composed of the KSeF token and the timestamp received in the challenge. The token constitutes the actual authenticating secret, while the timestamp serves as a nonce (IV), ensuring operation freshness and preventing cipher reproduction in subsequent sessions.

#### 1. Preparing and encrypting the token
A character string in the format:
```csharp
{tokenKSeF}|{timestampMs}
```
Where:
- `tokenKSeF` - KSeF token,
- `timestampMs` – timestamp from the response to `POST /auth/challenge`, passed as **number of milliseconds since January 1, 1970 (Unix timestamp, ms)**.

should be encrypted with the KSeF public key, using the ```RSA-OAEP``` algorithm with ```SHA-256 (MGF1)``` hash function. The resulting ciphertext should be encoded in ```Base64```.

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthChallengeResponse challenge = await KsefClient.GetAuthChallengeAsync();
long timestampMs = challenge.Timestamp.ToUnixTimeMilliseconds();

// Prepare "token|timestamp" and encrypt RSA-OAEP SHA-256 according to API requirement
string tokenWithTimestamp = $"{ksefToken}|{timestampMs}";
byte[] tokenBytes = System.Text.Encoding.UTF8.GetBytes(tokenWithTimestamp);
byte[] encrypted = CryptographyService.EncryptKsefTokenWithRSAUsingPublicKey(tokenBytes);
string encryptedTokenB64 = Convert.ToBase64String(encrypted);
```

Example in ```Java```:
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

#### 2. Sending authentication request with [KSeF token](tokeny-ksef.md)
The encrypted KSeF token should be sent together with

|    Key     |           Value                                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Challenge    | `Value received from /auth/challenge call`                                                                                                          |
| Context| `Context identifier for which authentication is performed (NIP, internal identifier, EU VAT composite identifier)`                                                                       |
| (optional) AuthorizationPolicy | `Rules for client IP address validation when using the issued access token (accessToken).` |  

using the endpoint call:

POST [/auth/ksef-token](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1ksef-token/post). <br>

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
// Method 1: Building request using builder
IAuthKsefTokenRequestBuilderWithEncryptedToken builder = AuthKsefTokenRequestBuilder
    .Create()
    .WithChallenge(challenge)
    .WithContext(contextIdentifierType, contextIdentifierValue)
    .WithEncryptedToken(encryptedToken);   
AuthenticationKsefTokenRequest authKsefTokenRequest = builder.Build();

// Method 2: manual object creation
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

Example in ```Java```:
[KsefTokenIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/KsefTokenIntegrationTest.java)

```java
 AuthKsefTokenRequest authTokenRequest = new AuthKsefTokenRequestBuilder()
        .withChallenge(challenge.getChallenge())
        .withContextIdentifier(new ContextIdentifier(ContextIdentifier.IdentifierType.NIP, contextNip))
        .withEncryptedToken(Base64.getEncoder().encodeToString(encryptedToken))
        .build();

SignatureResponse response = ksefClient.authenticateByKSeFToken(authTokenRequest);
```

Since the authentication process is asynchronous, the response returns a temporary operational token (```authenticationToken```) along with a reference number (```referenceNumber```). Both identifiers are used to:
* check the status of the authentication process,
* retrieve the proper access token (accessToken) in JWT format.

### 3. Checking authentication status

After sending the signed XML document (```AuthTokenRequest```) and receiving a response containing ```authenticationToken``` and ```referenceNumber```, you need to check the status of the ongoing authentication operation by providing Bearer \<authenticationToken\> in the ```Authorization``` header. <br>
GET [/auth/{referenceNumber}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1%7BreferenceNumber%7D/get)
The response returns the status – code and description of the operation state (e.g., "Authentication in progress", "Authentication completed successfully").

**Note**  
In pre-production and production environments, the system, in addition to verifying XAdES signature correctness, checks the current certificate status with its issuer (OCSP/CRL services). Until a binding response is obtained from the certificate provider, the operation status will return "Authentication in progress" - this is a normal consequence of the verification process and does not indicate a system error. Status checking is asynchronous; the result should be polled until completion. Verification time depends on the certificate issuer.

**Recommendation for production environment - KSeF certificate**  
To eliminate waiting for certificate status verification in OCSP/CRL services on the qualified trust service providers' side, it is recommended to use [KSeF certificate](certyfikaty-KSeF.md) authentication. KSeF certificate verification occurs within the system and happens immediately after signature reception.

**Error handling**  
In case of failure, the response may contain error codes related to incorrect signature, lack of permissions, or technical problems. A detailed list of error codes will be available in the endpoint's technical documentation.

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthStatus status = await KsefClient.GetAuthStatusAsync(signature.ReferenceNumber, signature.AuthenticationToken.Token);
```

Example in ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthStatus authStatus = ksefClient.getAuthStatus(referenceNumber, tempToken);
```

### 4. Obtaining access token (accessToken)
The endpoint returns a one-time pair of tokens generated for a successfully completed authentication process. Each subsequent call with the same ```authenticationToken``` will return a 400 error.

POST [/auth/token/redeem](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1token~1redeem/post)

Example in ```C#```:
[KSeF.Client.Tests.Core\E2E\KsefToken\KsefTokenE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/KsefToken/KsefTokenE2ETests.cs)

```csharp
AuthOperationStatusResponse tokens = await KsefClient.GetAccessTokenAsync(signature.AuthenticationToken.Token);
```

Example in ```Java```:
[BaseIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/configuration/BaseIntegrationTest.java)

```java
AuthOperationStatusResponse tokenResponse = ksefClient.redeemToken(response.getAuthenticationToken().getToken());
```

The response returns:
* ```accessToken``` – JWT access token used to authorize API operations (in Authorization: Bearer ... header), has limited validity time (e.g., several minutes, specified in exp field),
* ```refreshToken``` – token enabling ```accessToken``` refresh without re-authentication, has significantly longer validity period (up to 7 days) and can be used multiple times to refresh the access token.

**Note!**
1. ```accessToken``` and ```refreshToken``` should be treated as confidential data – their storage requires appropriate security measures.
2. The access token (`accessToken`) remains valid until the expiration date specified in the `exp` field, even if user permissions change.

#### 5. Refreshing access token (```accessToken```)
To maintain continuous access to protected API resources, the KSeF system provides a mechanism for refreshing the access token (```accessToken```) using a special refresh token (```refreshToken```). This solution eliminates the need to repeat the full authentication process each time, while also improving system security – the short lifetime of ```accessToken``` limits the risk of its unauthorized use in case of interception.

POST [/auth/token/refresh](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Uzyskiwanie-dostepu/paths/~1auth~1token~1refresh/post) <br>
```RefreshToken``` should be passed in the Authorization header in the format:
```
Authorization: Bearer {refreshToken}
```

The response contains a new ```accessToken``` (JWT) with the current set of permissions and roles.

 Example in ```C#```:

```csharp
RefreshTokenResponse refreshedAccessTokenResponse = await ksefClient.RefreshAccessTokenAsync(accessTokenResult.RefreshToken.Token);
```

Example in ```Java```:
[AuthorizationIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/AuthorizationIntegrationTest.java)

```java
AuthenticationTokenRefreshResponse refreshTokenResult = ksefClient.refreshAccessToken(initialRefreshToken);
```

#### 6. Managing authentication sessions 
Detailed information about managing active authentication sessions can be found in the document [Session management](auth/sesje.md).

Related documents: 
- [KSeF certificates](certyfikaty-KSeF.md)
- [Test certificates and XAdES signatures](auth/testowe-certyfikaty-i-podpisy-xades.md)
- [XAdES signature](auth/podpis-xades.md)
- [KSeF token](tokeny-ksef.md)

Related tests:
- [Authentication E2E](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests/Features/Authenticate/Authenticate.feature.cs)
