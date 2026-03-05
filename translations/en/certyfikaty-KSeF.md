---
original: certyfikaty-KSeF.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [certyfikaty-KSeF.md](https://github.com/CIRFMF/ksef-docs/blob/main/certyfikaty-KSeF.md)

## KSeF Certificates
03.02.2026

### Introduction

A KSeF certificate is a **bearer of identity** of the authenticating entity (most commonly identified by **PESEL** or **NIP**, and in some cases by the **fingerprint** of the certificate that was used for authentication when requesting the KSeF certificate). The certificate itself **does not carry any KSeF permissions** and **is not assigned to any context** (e.g., company NIP / unit InternalId / NipVatUe). Permissions are managed and verified **on the KSeF side** based on the permissions model.

Endpoints for certificate management are available after [authentication](uwierzytelnianie.md). These operations concern the **authenticated entity** (certificate owner) and are not associated with the login context in which the access token was obtained. This means that a given authenticated entity (e.g., a person identified by PESEL) has access to the same set of certificates regardless of the context in which the access token was obtained.

A request for issuing a KSeF certificate can only be submitted for data that is contained in the certificate used for [authentication](uwierzytelnianie.md). Based on this data, the endpoint [/certificates/enrollments/data](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1data/get) returns identification data that must be used in the certificate request.

> Note: a request for a KSeF certificate can only be submitted "on one's own behalf" – identification data for the CSR is read from the certificate used for authentication, and their modification results in rejection of the request.

Two types of certificates are available – each certificate can have **only one type** (`Authentication` or `Offline`). It is not possible to issue a certificate combining both functions.

| Type             | Description |
| ---------------- | ----------- |
| `Authentication` | Certificate intended for authentication in the KSeF system.<br/>**keyUsage:** Digital Signature (80) |
| `Offline`        | Certificate intended exclusively for issuing invoices in offline mode. Used to confirm the authenticity of the issuer and integrity of the invoice through [QR code II](kody-qr.md). Does not enable authentication.<br/>**keyUsage:** Non-Repudiation (40) |

#### Certificate acquisition process
The certificate application process consists of several stages:
1. Checking available limits,
2. Retrieving data for the certificate request,
3. Sending the request,
4. Downloading the issued certificate,

### 1. Checking limits

Before an API client submits a request for issuing a new certificate, it is recommended to verify the certificate limit.

The API provides information about:
* the maximum number of certificates that can be held,
* the number of currently active certificates,
* the possibility of submitting another request.

GET [/certificates/limits](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1limits/get)

Example in C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateLimitResponse certificateLimitResponse = await KsefClient
    .GetCertificateLimitsAsync(accessToken, CancellationToken);
```

Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateLimitsResponse response = ksefClient.getCertificateLimits(accessToken);
```

### 2. Retrieving data for the certificate request

To start the KSeF certificate application process, you need to retrieve a set of identification data that the system will return in response to calling the endpoint  
GET [/certificates/enrollments/data](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1data/get).

This data is read from the certificate used for authentication, which can be:
- a qualified certificate of a natural person – containing PESEL or NIP number,
- a qualified certificate of an organization (so-called company seal) – containing NIP number,
- Trusted Profile (ePUAP) – used by natural persons, contains PESEL number,
- internal KSeF certificate – issued by the KSeF system, is not a qualified certificate, but is honored in the authentication process.

Based on this, the system returns a complete set of DN (X.500 Distinguished Name) attributes that must be used when building the certificate request (CSR). Modifying this data will result in rejection of the request.

**Note**: Retrieving certificate data is only possible after authentication using a signature (XAdES). Authentication using a KSeF system token does not allow submitting a certificate request.

Example in C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateEnrollmentsInfoResponse certificateEnrollmentsInfoResponse =
    await KsefClient.GetCertificateEnrollmentDataAsync(accessToken, CancellationToken).ConfigureAwait(false);
```

Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateEnrollmentsInfoResponse response = ksefClient.getCertificateEnrollmentInfo(accessToken);
```

Here is a complete list of fields that can be returned, presented in a table format containing OIDs:

| OID      | Name (eng.)           | Description                            | Natural person | Company seal |
|----------|-----------------------|----------------------------------------|----------------|--------------|
| 2.5.4.3  | commonName            | Common name                            | ✔️             | ✔️           |
| 2.5.4.4  | surname               | Surname                                | ✔️             | ❌           |
| 2.5.4.5  | serialNumber          | Serial number (e.g. PESEL, NIP)       | ✔️             | ❌           |
| 2.5.4.6  | countryName           | Country code (e.g. PL)                 | ✔️             | ✔️           |
| 2.5.4.10 | organizationName      | Organization name / company            | ❌             | ✔️           |
| 2.5.4.42 | givenName             | Given name or names                    | ✔️             | ❌           |
| 2.5.4.45 | uniqueIdentifier      | Unique identifier (optional)           | ✔️             | ✔️           |
| 2.5.4.97 | organizationIdentifier| Organization identifier (e.g. NIP)     | ❌             | ✔️           |

The `givenName` attribute can appear multiple times and is returned as a list of values.

### 3. Preparing CSR (Certificate Signing Request)
To submit a request for a KSeF certificate, you need to prepare a Certificate Signing Request (CSR) in the PKCS#10 standard, in DER format, encoded in Base64. The CSR contains:
* information identifying the entity (DN – Distinguished Name),
* the public key that will be associated with the certificate.

Requirements for the private key used to sign the CSR:
* Allowed types:
  * RSA (OID: 1.2.840.113549.1.1.1), key length: 2048 bits,
  * EC (elliptic keys, OID: 1.2.840.10045.2.1), NIST P-256 curve (secp256r1).
* EC keys are recommended.

* Allowed signature algorithms:
  * RSA PKCS#1 v1.5,
  * RSA PSS,
  * ECDSA (signature format compliant with RFC 3279).

* Allowed hash functions used for CSR signing:
  * SHA1,
  * SHA256,
  * SHA384,
  * SHA512.

All identification data (X.509 attributes) should match the values returned by the system in the previous step (/certificates/enrollments/data). Modifying this data will result in rejection of the request.

Example in C# (using ```ICryptographyService```):
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
var (csr, key) = CryptographyService.GenerateCsrWithRSA(TestFixture.EnrollmentInfo);
```

Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CsrResult csr = defaultCryptographyService.generateCsrWithRsa(enrollmentInfo);
```

* ```csrBase64Encoded``` – contains the CSR request encoded in Base64 format, ready to be sent to KSeF
* ```privateKeyBase64Encoded``` – contains the private key associated with the generated CSR, encoded in Base64. This key will be needed for signing operations when using the certificate.

**Note**: The private key should be stored securely and in accordance with the security policy of the given organization.

### 4. Sending the certificate request
After preparing the Certificate Signing Request (CSR), it should be sent to the KSeF system using the call 

POST [/certificates/enrollments](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments/post)

The submitted request should include:
* **certificate name** – visible later in certificate metadata, facilitating identification,
* **certificate type** – `Authentication` or `Offline`,
* **CSR** in PKCS#10 format (DER), encoded as a Base64 string,
* (optionally) **validFrom** – start date of validity. If not specified, the certificate will be valid from the moment of its issuance.

Make sure the CSR contains exactly the same data that was returned by the /certificates/enrollments/data endpoint.

Example in C#:
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

Example in Java:
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

In response, you will receive a ```referenceNumber``` that enables monitoring the request status and later downloading the issued certificate.

### 5. Checking request status

The certificate issuance process is asynchronous. This means that the system does not return the certificate immediately after submitting the request, but allows its later retrieval after processing is completed.
The request status should be checked periodically, using the reference number (```referenceNumber```) that was returned in response to sending the request (/certificates/enrollments).

GET [/certificates/enrollments/\{referenceNumber\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1enrollments~1%7BreferenceNumber%7D/get)

If the certificate request is rejected, we will receive error information in the response.

Example in C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
CertificateEnrollmentStatusResponse certificateEnrollmentStatusResponse = await KsefClient
    .GetCertificateEnrollmentStatusAsync(TestFixture.EnrollmentReference, accessToken, CancellationToken);
```

Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateEnrollmentStatusResponse response = ksefClient.getCertificateEnrollmentStatus(referenceNumber, accessToken);

```

After obtaining the certificate serial number (```certificateSerialNumber```), it is possible to retrieve its content and metadata in the subsequent steps of the process.

### 6. Retrieving certificate list

The KSeF system enables retrieving the content of previously issued internal certificates based on a list of serial numbers. Each certificate is returned in DER format, encoded as a Base64 string.

POST [/certificates/retrieve](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1retrieve/post)

Example in C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)

```csharp
CertificateListRequest certificateListRequest = new CertificateListRequest { CertificateSerialNumbers = TestFixture.SerialNumbers };

CertificateListResponse certificateListResponse = await KsefClient
    .GetCertificateListAsync(certificateListRequest, accessToken, CancellationToken);
```

Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateListResponse certificateResponse = ksefClient.getCertificateList(new CertificateListRequest(List.of(certificateSerialNumber)), accessToken);
```

Each response element contains:

| Field                     | Description                                        |
|---------------------------|----------------------------------------------------|
| `certificateSerialNumber` | Certificate serial number                          |
| `certificateName`         | Certificate name assigned during registration      |
| `certificate`             | Certificate content encoded in Base64 (DER format)|
| `certificateType`         | Certificate type (`Authentication`, `Offline`)    |

### 7. Retrieving certificate metadata list

It is possible to retrieve a list of internal certificates submitted by a given entity. This data includes both active and historical certificates, along with their status, validity range, and identifiers.

POST [/certificates/query](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1query/post)

Filtering parameters (optional):
* `status` - certificate status (`Active`, `Blocked`, `Revoked`, `Expired`)
* `expiresAfter` - certificate expiration date (optional)
* `name` - certificate name (optional)
* `type` - certificate type (`Authentication`, `Offline`) (optional)
* `certificateSerialNumber` - certificate serial number (optional)
* `pageSize` - number of elements per page (default 10)
* `pageOffset` - page number of results (default 0)

Example in C#:
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
Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
QueryCertificatesRequest request = new CertificateMetadataListRequestBuilder().build();

CertificateMetadataListResponse response = ksefClient.getCertificateMetadataList(request, pageSize, pageOffset, accessToken);


```

In response, we will receive certificate metadata.

### 8. Certificate revocation

A KSeF certificate can only be revoked by the owner in case of private key compromise, termination of its use, or organizational change. After revocation, the certificate cannot be used for further authentication or performing operations in the KSeF system.
Revocation is performed based on the certificate serial number (```certificateSerialNumber```) and an optional revocation reason.

POST [/certificates/\{certificateSerialNumber\}/revoke](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Certyfikaty/paths/~1certificates~1%7BcertificateSerialNumber%7D~1revoke/post)

Example in C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
CertificateRevokeRequest certificateRevokeRequest = RevokeCertificateRequestBuilder
        .Create()
        .WithRevocationReason(CertificateRevocationReason.KeyCompromise)
        .Build();

await ksefClient.RevokeCertificateAsync(request, certificateSerialNumber, accessToken, cancellationToken)
     .ConfigureAwait(false);
```

Example in Java:
[CertificateIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/CertificateIntegrationTest.java)

```java
CertificateRevokeRequest request = new CertificateRevokeRequestBuilder()
        .withRevocationReason(CertificateRevocationReason.KEYCOMPROMISE)
        .build();

ksefClient.revokeCertificate(request, serialNumber, accessToken);
```

After revocation, the certificate cannot be reused. If there is a need for its further use, a new certificate must be requested.
