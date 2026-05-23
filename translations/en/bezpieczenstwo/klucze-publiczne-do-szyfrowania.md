---
original: bezpieczenstwo/klucze-publiczne-do-szyfrowania.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: d92d285
last_translated: 2026-05-23
---

> **Translation.** Original: [bezpieczenstwo/klucze-publiczne-do-szyfrowania.md](https://github.com/CIRFMF/ksef-docs/blob/main/bezpieczenstwo/klucze-publiczne-do-szyfrowania.md)

# Public Keys for Encryption
05.05.2026

This document describes how KSeF publishes **public keys used for client-side encryption**, how the **rotation** processes work, and how to correctly handle the scenario of switching to a new key.

## 1. Introduction

In selected API operations that require client-side encryption, the transmitted data is encrypted using KSeF's **public key**, made available in the form of an `X.509` certificate.

## 2. Publishing Public Keys

Public key certificates are made available via the endpoint:

- `GET /security/public-key-certificates`

The `X.509` certificate published by the KSeF API is issued by a qualified certification authority (CA).
The `Subject` field of the certificate identifies the entity to which the public key belongs, in particular: `CN = Ministerstwo Finansów`.

The response contains:

- `certificate` - the `X.509` certificate in `DER` (binary) format, encoded in `Base64` (without BEGIN/END headers).
- `certificateId` - the certificate identifier (a **SHA-256** hash of the certificate's DER encoding, encoded in `Base64` format).
- `publicKeyId` - the key identifier (a **SHA-256** hash of the DER encoding of the public key (`SubjectPublicKeyInfo`) contained in the certificate, encoded in `Base64` format), used as a selector in calls where the client indicates **which public key was used for encryption**.
- `validFrom`, `validTo` - the certificate's validity period.
- `usage` - the intended use of the key (e.g. `KsefTokenEncryption`, `SymmetricKeyEncryption`).

Example response:

```json
[
  {
    "certificate": "MIIGWDCCBECgAwIBAgIQGmXqNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQGEwJQ...",
    "certificateId": "1ehGlGObVNNm4OE6nIF879NoCIAYbwP0AZQDPJ4+tSQ=",
    "publicKeyId": "bCLIk+crwFEhRWdsWVy/MqwpR/8KiEmr+2cFZf1bPv0=",    
    "validFrom": "2025-09-29T06:03:19+00:00",
    "validTo": "2027-09-29T06:03:18+00:00",
    "usage": ["KsefTokenEncryption"]
  },
  {
    "certificate": "MIIGWDCCBECgAwIBADADADNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQD2D2...",
    "certificateId": "p7TsAeUHK/v5sPmPwTX+Dodxe3E2TQ/G0c5vlHbqri4=",
    "publicKeyId": "P2GDBhdfCxZMbmCXebZOsWr8pBpXeFBwD2qusHd3WZs=",
    "validFrom": "2025-09-29T06:17:45+00:00",
    "validTo": "2027-09-29T06:17:44+00:00",
    "usage": ["SymmetricKeyEncryption"]
  }
]
```

## 3. Certificate and Key Rotation

The KSeF API publishes an `X.509` certificate containing the public key.  
Publication of a new certificate may result from one of two situations:

1. **Re-certification** - a new certificate is published for the existing key pair.
2. **Key rotation** - a new key pair is generated, and along with it a new certificate containing the new public key is published.

### 3.1. Re-certification (same key)

Re-certification involves publishing a new `X.509` certificate for the same public key.

In this case:

- the key pair remains unchanged,
- `publicKeyId` remains unchanged,
- the certificate changes (`certificate`, `certificateId`, validity period).

This is a planned scenario, most commonly associated with the expiry of the certificate's validity period.

#### Example

Before re-certification, `GET /security/public-key-certificates` returns:

```json
[
  {
    "certificate": "MIIGWDCCBECgAwIBADADADNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQD2D2...",
    "certificateId": "p7TsAeUHK/v5sPmPwTX+Dodxe3E2TQ/G0c5vlHbqri4=",
    "publicKeyId": "P2GDBhdfCxZMbmCXebZOsWr8pBpXeFBwD2qusHd3WZs=",
    "validFrom": "2025-09-29T06:17:45+00:00",
    "validTo": "2027-09-29T06:17:44+00:00",
    "usage": ["SymmetricKeyEncryption"]
  },
  ...
]
```

After re-certification, `GET /security/public-key-certificates` returns:

```json
[
  {
    "certificate": "MIIHGDCCBQCgAwIBAgIQBPt+Qi6c4aJSoufT3qmudDANBgkqhkiG9w0BAQsFADBnMQswCQYDVQQGE...",
    "certificateId": "4jvqWdpkjTMwORT2hrRMcmnnBAuGMR9UEw1aEO4mQMk=",
    "publicKeyId": "P2GDBhdfCxZMbmCXebZOsWr8pBpXeFBwD2qusHd3WZs=",
    "validFrom": "2027-05-14T06:12:41+00:00",
    "validTo": "2029-05-14T06:12:40+00:00",
    "usage": ["SymmetricKeyEncryption"]
  },
  ...
]
```

### 3.2. Key Rotation (new public key)

Key rotation means generating a new key pair (public and private). Implementations using the published keys should always be prepared for the possibility of rotation — including in emergency mode.

In normal operation (in the absence of security incidents), frequent rotations should not be expected. However, it cannot be assumed that the key will remain unchanged for the entire lifetime of the system.

In the event of a key rotation:

- a new key pair is generated,
- `publicKeyId` changes,
- a new `X.509` certificate containing the new public key is published.

Typical reasons for key rotation:

- suspected compromise or a security incident,
- change in cryptographic requirements (e.g. algorithm, parameters, key size),
- compliance or security policy requirements (periodic rotation),
- operational decisions.

### 3.2.1. Planned Rotation

Planned rotation results from an adopted security policy, compliance requirements, or periodic key exchange.

In the case of a planned rotation, the new certificate may be published in advance.  
During the transition period, the API will return at least two certificates for the same `usage`:
- the current certificate,
- the new certificate containing the new public key.

After the transition period ends, the previous certificate will be removed from the list.

#### Example - planned rotation

Before rotation, `GET /security/public-key-certificates` returns:

```json
[
  {
    "certificate": "MIIGWDCCBECgAwIBADADADNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQD2D2...",
    "certificateId": "p7TsAeUHK/v5sPmPwTX+Dodxe3E2TQ/G0c5vlHbqri4=",
    "publicKeyId": "P2GDBhdfCxZMbmCXebZOsWr8pBpXeFBwD2qusHd3WZs=",
    "validFrom": "2025-09-29T06:17:45+00:00",
    "validTo": "2027-09-29T06:17:44+00:00",
    "usage": ["SymmetricKeyEncryption"]
  }
  ...
]
```

After rotation, `GET /security/public-key-certificates` returns:

```json
[
  {
    "certificate": "MIIGWDCCBECgAwIBADADADNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQD2D2...",
    "certificateId": "p7TsAeUHK/v5sPmPwTX+Dodxe3E2TQ/G0c5vlHbqri4=",
    "publicKeyId": "P2GDBhdfCxZMbmCXebZOsWr8pBpXeFBwD2qusHd3WZs=",
    "validFrom": "2025-09-29T06:17:45+00:00",
    "validTo": "2027-09-29T06:17:44+00:00",
    "usage": ["SymmetricKeyEncryption"]
  },
  {
    "certificate": "MIIGWDCCBECgAwIBAgIQGmXqNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQGE...",
    "certificateId": "tQL/24cjRkqTRKf3LhwQcAudH2SgjgTcVGsWs89jqK4=",
    "publicKeyId": "0e3zYM0m1wT85iHZZt1J8QLvCpnN2t+RcFgHXkCh3xA=",
    "validFrom": "2027-03-14T06:12:41+00:00",
    "validTo": "2029-03-14T06:12:40+00:00",
    "usage": ["SymmetricKeyEncryption"]
  },
  ...
]
```

### 3.2.2. Emergency Rotation (security incident)

An emergency rotation may be carried out in the event of a suspected compromise of the private key or another security incident.

In such a case:  
- the private key ceases to be used for cryptographic operations on the KSeF side,
- the `X.509` certificates associated with it are revoked at the certificate provider (CA),
- certificates associated with the revoked key are no longer returned by the `GET /security/public-key-certificates` endpoint,
- the previous `publicKeyId` is no longer accepted by the API,
- a new certificate containing the new public key is published.

### Example - emergency rotation

Before rotation, `GET /security/public-key-certificates` returns:

```json
[
  {
    "certificate": "MIIGWDCCBECgAwIBADADADNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQD2D2...",
    "certificateId": "p7TsAeUHK/v5sPmPwTX+Dodxe3E2TQ/G0c5vlHbqri4=",
    "publicKeyId": "P2GDBhdfCxZMbmCXebZOsWr8pBpXeFBwD2qusHd3WZs=",
    "validFrom": "2025-09-29T06:17:45+00:00",
    "validTo": "2027-09-29T06:17:44+00:00",
    "usage": ["SymmetricKeyEncryption"]
  },
  ...
]
```

After rotation, `GET /security/public-key-certificates` returns:

```json
[
  {
    "certificate": "MIIGWDCCBECgAwIBAgIQGmXqNRg5ye1JMZDOQ7HNCTANBgkqhkiG9w0BAQsFADBOMQswCQYDVQQGE...",
    "certificateId": "tQL/24cjRkqTRKf3LhwQcAudH2SgjgTcVGsWs89jqK4=",
    "publicKeyId": "0e3zYM0m1wT85iHZZt1J8QLvCpnN2t+RcFgHXkCh3xA=",
    "validFrom": "2027-03-14T06:12:41+00:00",
    "validTo": "2029-03-14T06:12:40+00:00",
    "usage": ["SymmetricKeyEncryption"]
  },
  ...
]
```

## 4. Usage Scenario

### 4.1. Retrieving Certificates

1. The client calls:
   - `GET /security/public-key-certificates`
2. The client selects the certificate appropriate for the `usage` (e.g. `KsefTokenEncryption` or `SymmetricKeyEncryption`), valid at the time of the operation; when multiple valid certificates are available, the client prefers the certificate with the latest `validFrom` date.
3. The client encrypts the data using the **public key** from the selected certificate.

### 4.2. Passing the `publicKeyId` Selector to Selected Endpoints

`publicKeyId` is passed in the request model to the endpoints for which the system must unambiguously determine which public key the client used for encryption.

This applies to:
- `POST /auth/ksef-token`
- `POST /sessions/online`
- `POST /sessions/batch`,
- `POST /invoices/exports`.

### 4.3. Validation on the KSeF Side

The endpoint validates:
- whether `publicKeyId` is known for the given `usage`,
- whether the indicated key is currently accepted (valid and not revoked).

If the key is not accepted, the API returns an error:
  - HTTP `400`
  - code: `21470` - The submitted key identifier is unknown or refers to a revoked key.

### 4.4. Handling Error 21470

If the client receives error `21470`:  
1. Re-fetch the list:
   - `GET /security/public-key-certificates`
2. Select the current certificate for the given `usage` (e.g. `KsefTokenEncryption` or `SymmetricKeyEncryption`), valid at the time of the operation; when multiple valid certificates are available, prefer the certificate with the latest `validFrom` date.
3. Repeat the operation using the new key (new `publicKeyId`).
