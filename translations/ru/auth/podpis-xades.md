---
original: auth/podpis-xades.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [auth/podpis-xades.md](https://github.com/CIRFMF/ksef-docs/blob/main/auth/podpis-xades.md)

# Подпись XAdES
https://www.w3.org/TR/XAdES/
## Технические параметры подписи XAdES
### Допустимые форматы подписи

- **охватываемый** (enveloped)
- **охватывающий** (enveloping)

Подпись в внешнем формате (**detached**) не принимается.

### Допустимые преобразования, содержащиеся в подписи XAdES

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

### Принятые профили XAdES

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

### Алгоритм подписи SignedInfo (`ds:SignatureMethod`)

**RSASSA-PKCS1-v1_5**  
http://www.w3.org/2000/09/xmldsig#rsa-sha1  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha256  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha384  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha512  

Минимальная длина ключа: 2048 бит 

**RSASSA-PSS**  
http://www.w3.org/2007/05/xmldsig-more#sha1-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha256-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha384-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha512-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-256-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-384-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-512-rsa-MGF1  

Минимальная длина ключа: 2048 бит

**ECDSA**  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha512  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-256  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-384  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-512  

Минимальный размер кривой: 256 бит  
> Для ECDSA значение `SignatureValue` кодируется как `R || S` (fixed-field concatenation) согласно XML Signature (XMLDSIG) 1.1 / [RFC 4050](https://datatracker.ietf.org/doc/html/rfc4050#section-3.3).

### Алгоритмы хеширования в ссылках (`DigestMethod`)

`DigestMethod` относится к хешу данных, указанных ссылками в `SignedInfo`
(т.е. `SignedInfo / Reference / DigestMethod`) и не зависит от `SignatureMethod` (алгоритма подписи `SignedInfo`).

Те же алгоритмы хеширования используются также для вычисления хешей квалифицирующих свойств, в частности хеша сертификата в `SigningCertificate / CertDigest / DigestMethod`.


http://www.w3.org/2000/09/xmldsig#sha1  
http://www.w3.org/2001/04/xmlenc#sha256  
http://www.w3.org/2001/04/xmldsig-more#sha384  
http://www.w3.org/2001/04/xmlenc#sha512  
http://www.w3.org/2007/05/xmldsig-more#sha3-256  
http://www.w3.org/2007/05/xmldsig-more#sha3-384  
http://www.w3.org/2007/05/xmldsig-more#sha3-512  


### Разрешенные типы сертификатов

Разрешенные типы сертификатов в подписи XAdES:
* Квалифицированный сертификат физического лица – содержащий номер PESEL или NIP лица, имеющего полномочия действовать от имени компании,
* Квалифицированный сертификат организации (так называемая корпоративная печать) - содержащий номер NIP,
* Профиль Доверенный (ePUAP) – позволяет подписать документ; используется физическими лицами,
* Внутренний сертификат KSeF – выдаваемый системой KSeF. Данный сертификат не является квалифицированным сертификатом, но принимается в процессе аутентификации.

**Квалифицированный сертификат** – сертификат, выданный квалифицированным поставщиком доверенных услуг, включенным в европейский реестр [EU Trusted List (EUTL)](https://eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls), в соответствии с регламентом eIDAS. В KSeF принимаются квалифицированные сертификаты, выданные в Польше и в других государствах-членах Европейского Союза.

### Обязательные атрибуты квалифицированных сертификатов

#### Сертификаты квалифицированной подписи (выдаваемые для физических лиц)

Обязательные атрибуты субъекта:<br/>
| Идентификатор (OID) | Название       | Значение                                 |
|---------------------|----------------|------------------------------------------|
| 2.5.4.42            | givenName      | имя                                      |
| 2.5.4.4             | surname        | фамилия                                  |
| 2.5.4.5             | serialNumber   | серийный номер                           |
| 2.5.4.3             | commonName     | общее название владельца сертификата     |
| 2.5.4.6             | countryName    | название страны, код ISO 3166            |

Распознаваемые шаблоны атрибута `serialNumber`:<br>
**(PNOPL|PESEL).\*?(?<number>\\d{11})**<br>
**(TINPL|NIP).\*?(?<number>\\d{10})**<br>

#### Сертификаты квалифицированной печати (выдаваемые для организаций)

Обязательные атрибуты субъекта:<br/>
| Идентификатор (OID) | Название                | Значение                                                            |
|---------------------|-------------------------|---------------------------------------------------------------------|
| 2.5.4.10            | organizationName        | полное формальное название субъекта, для которого выдается сертификат |
| 2.5.4.97            | organizationIdentifier  | идентификатор субъекта                                              |
| 2.5.4.3             | commonName              | общее название организации                                          |
| 2.5.4.6             | countryName             | название страны, код ISO 3166                                       |

Недопустимые атрибуты субъекта:
| Идентификатор (OID) | Название    | Значение |
|---------------------|------------ |----------|
| 2.5.4.42            | givenName   | имя      |  
| 2.5.4.4             | surname     | фамилия  |

Распознаваемые шаблоны атрибута `organizationIdentifier`:<br>
**(VATPL).\*?(?<number>\\d{10})**<br>

### Отпечаток сертификата

В случае квалифицированных сертификатов, не имеющих соответствующих идентификаторов, записанных в атрибуте субъекта OID.2.5.4.5, возможна аутентификация таким сертификатом после предварительного предоставления прав на хеш SHA-256 (так называемый отпечаток) этого сертификата.

Связанные документы: 
- [Аутентификация](../uwierzytelnianie.md)
