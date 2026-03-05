---
original: auth/podpis-xades.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [auth/podpis-xades.md](https://github.com/CIRFMF/ksef-docs/blob/main/auth/podpis-xades.md)

# XAdES Signature
https://www.w3.org/TR/XAdES/
## Technical Parameters of XAdES Signature
### Accepted Signature Formats

- **enveloped**
- **enveloping**

Signature in **detached** format is not accepted.

### Accepted Transforms Contained in XAdES Signature

- http://www.w3.org/TR/1999/REC-xpath-19991116 - not(ancestor-or-self::ds:Signature)
- http://www.w3.org/2002/06/xmldsig-filter2
- http://www.w3.org/2000/09/xmldsig#enveloped-signature
- http://www.w3.org/2000/09/xmldsig#base64
- http://www.w3.org/2006/12/xml-c14n11
- http://www.w3.org/2006/12/xml-c14n11#WithComments
- http://www.w3.org/2001/10/xml-exc-c14n#
- http://www.w3.org/2001/10/xml-exc-c14n#WithComments
- http://www.w3.org/TR/2001/REC-xml-c14n-20010315
- http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments

### Accepted XAdES Profiles

- XAdES-BES
- XAdES-EPES
- XAdES-T
- XAdES-LT
- XAdES-C
- XAdES-X
- XAdES-XL
- XAdES-A
- XAdES-ERS
- XAdES-BASELINE-B
- XAdES-BASELINE-T
- XAdES-BASELINE-LT
- XAdES-BASELINE-LTA

### SignedInfo Signature Algorithm (`ds:SignatureMethod`)

**RSASSA-PKCS1-v1_5**  
http://www.w3.org/2000/09/xmldsig#rsa-sha1  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha256  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha384  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha512  

Minimum key length: 2048 bits 

**RSASSA-PSS**  
http://www.w3.org/2007/05/xmldsig-more#sha1-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha256-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha384-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha512-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-256-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-384-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-512-rsa-MGF1  

Minimum key length: 2048 bits

**ECDSA**  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha512  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-256  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-384  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-512  

Minimum curve size: 256 bits  
> For ECDSA, the `SignatureValue` is encoded as `R || S` (fixed-field concatenation) according to XML Signature (XMLDSIG) 1.1 / [RFC 4050](https://datatracker.ietf.org/doc/html/rfc4050#section-3.3).

### Hash Algorithms in References (`DigestMethod`)

`DigestMethod` refers to the hash of data indicated by references in `SignedInfo`
(i.e., `SignedInfo / Reference / DigestMethod`) and is independent of `SignatureMethod` (the `SignedInfo` signature algorithm).

The same hash algorithms are also used for calculating hashes of qualifying properties, in particular certificate hash in `SigningCertificate / CertDigest / DigestMethod`.


http://www.w3.org/2000/09/xmldsig#sha1  
http://www.w3.org/2001/04/xmlenc#sha256  
http://www.w3.org/2001/04/xmldsig-more#sha384  
http://www.w3.org/2001/04/xmlenc#sha512  
http://www.w3.org/2007/05/xmldsig-more#sha3-256  
http://www.w3.org/2007/05/xmldsig-more#sha3-384  
http://www.w3.org/2007/05/xmldsig-more#sha3-512  


### Allowed Certificate Types

Allowed certificate types in XAdES signature:
* Qualified certificate for natural persons – containing PESEL number or NIP of a person authorized to act on behalf of a company,
* Qualified certificate for organizations (so-called company seal) – containing NIP number,
* Trusted Profile (ePUAP) – enables document signing; used by natural persons,
* Internal KSeF certificate – issued by the KSeF system. This certificate is not a qualified certificate, but is honored in the authentication process.

**Qualified certificate** – a certificate issued by a qualified trust service provider, listed in the [EU Trusted List (EUTL)](https://eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls), in accordance with the eIDAS regulation. KSeF accepts qualified certificates issued in Poland and in other European Union member states.

### Required Attributes of Qualified Certificates

#### Qualified signature certificates (issued for natural persons)

Required subject attributes:<br/>
| Identifier (OID) | Name          | Meaning                                |
|---------------------|----------------|------------------------------------------|
| 2.5.4.42            | givenName      | given name                                     |
| 2.5.4.4             | surname        | surname                                 |
| 2.5.4.5             | serialNumber   | serial number                            |
| 2.5.4.3             | commonName     | common name of certificate owner |
| 2.5.4.6             | countryName    | country name, ISO 3166 code                |

Recognized patterns for `serialNumber` attribute:<br>
**(PNOPL|PESEL).\*?(?<number>\\d{11})**<br>
**(TINPL|NIP).\*?(?<number>\\d{10})**<br>

#### Qualified seal certificates (issued for organizations)

Required subject attributes:<br/>
| Identifier (OID) | Name                   | Meaning                                                           |
|---------------------|-------------------------|---------------------------------------------------------------------|
| 2.5.4.10            | organizationName        | full formal name of the entity for which the certificate is issued |
| 2.5.4.97            | organizationIdentifier  | entity identifier                                              |
| 2.5.4.3             | commonName              | common name of organization                                        |
| 2.5.4.6             | countryName             | country name, ISO 3166 code                                           |

Prohibited subject attributes:
| Identifier (OID) | Name       | Meaning |
|---------------------|------------ |-----------|
| 2.5.4.42            | givenName   | given name      |  
| 2.5.4.4             | surname     | surname  |

Recognized patterns for `organizationIdentifier` attribute:<br>
**(VATPL).\*?(?<number>\\d{10})**<br>

### Certificate Fingerprint

For qualified certificates that do not have proper identifiers stored in the subject attribute OID.2.5.4.5, it is possible to authenticate with such a certificate after prior granting permissions to the SHA-256 hash (so-called fingerprint) of that certificate.

Related documents: 
- [Authentication](../uwierzytelnianie.md)
