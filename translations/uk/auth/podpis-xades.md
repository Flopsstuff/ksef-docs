---
original: auth/podpis-xades.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [auth/podpis-xades.md](https://github.com/CIRFMF/ksef-docs/blob/main/auth/podpis-xades.md)

# Підпис XAdES
https://www.w3.org/TR/XAdES/
## Технічні параметри підпису XAdES
### Допустимі формати підпису

- **оточений** (enveloped)
- **оточуючий** (enveloping)

Підпис у зовнішньому форматі (**detached**) не приймається.

### Допустимі трансформації, що містяться у підписі XAdES

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

### Прийнятні профілі XAdES

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

### Алгоритм підпису SignedInfo (`ds:SignatureMethod`)

**RSASSA-PKCS1-v1_5**  
http://www.w3.org/2000/09/xmldsig#rsa-sha1  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha256  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha384  
http://www.w3.org/2001/04/xmldsig-more#rsa-sha512  

Мінімальна довжина ключа: 2048 біт 

**RSASSA-PSS**  
http://www.w3.org/2007/05/xmldsig-more#sha1-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha256-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha384-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha512-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-256-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-384-rsa-MGF1  
http://www.w3.org/2007/05/xmldsig-more#sha3-512-rsa-MGF1  

Мінімальна довжина ключа: 2048 біт

**ECDSA**  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384  
http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha512  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-256  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-384  
http://www.w3.org/2021/04/xmldsig-more#ecdsa-sha3-512  

Мінімальний розмір кривої: 256 біт  
> Для ECDSA значення `SignatureValue` кодується як `R || S` (fixed-field concatenation) відповідно до XML Signature (XMLDSIG) 1.1 / [RFC 4050](https://datatracker.ietf.org/doc/html/rfc4050#section-3.3).

### Алгоритми гешування у посиланнях (`DigestMethod`)

`DigestMethod` стосується гешу даних, на які вказують посилання у `SignedInfo`
(тобто `SignedInfo / Reference / DigestMethod`) і є незалежним від `SignatureMethod` (алгоритму підпису `SignedInfo`).

Ті самі алгоритми гешування використовуються також для обчислення гешів кваліфікуючих властивостей, зокрема гешу сертифіката у `SigningCertificate / CertDigest / DigestMethod`.


http://www.w3.org/2000/09/xmldsig#sha1  
http://www.w3.org/2001/04/xmlenc#sha256  
http://www.w3.org/2001/04/xmldsig-more#sha384  
http://www.w3.org/2001/04/xmlenc#sha512  
http://www.w3.org/2007/05/xmldsig-more#sha3-256  
http://www.w3.org/2007/05/xmldsig-more#sha3-384  
http://www.w3.org/2007/05/xmldsig-more#sha3-512  


### Дозволені типи сертифікатів

Дозволені типи сертифікатів у підписі XAdES:
* Кваліфікований сертифікат фізичної особи – що містить номер PESEL або NIP особи, яка має повноваження діяти від імені компанії,
* Кваліфікований сертифікат організації (так звана корпоративна печатка) - що містить номер NIP,
* Профіль Zaufany (ePUAP) – дозволяє підписати документ; використовується фізичними особами,
* Внутрішній сертифікат KSeF – видається системою KSeF. Цей сертифікат не є кваліфікованим, але визнається в процесі автентифікації.

**Кваліфікований сертифікат** – сертифікат, виданий кваліфікованим постачальником довірених послуг, внесеним до європейського реєстру [EU Trusted List (EUTL)](https://eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls), відповідно до регламенту eIDAS. У KSeF приймаються кваліфіковані сертифікати, видані в Польщі та в інших державах-членах Європейського Союзу.

### Обов'язкові атрибути кваліфікованих сертифікатів

#### Сертифікати кваліфікованого підпису (видаються для фізичних осіб)

Обов'язкові атрибути суб'єкта:<br/>
| Ідентифікатор (OID) | Назва          | Значення                                 |
|---------------------|----------------|------------------------------------------|
| 2.5.4.42            | givenName      | ім'я                                     |
| 2.5.4.4             | surname        | прізвище                                 |
| 2.5.4.5             | serialNumber   | серійний номер                           |
| 2.5.4.3             | commonName     | загальна назва власника сертифіката      |
| 2.5.4.6             | countryName    | назва країни, код ISO 3166               |

Розпізнавані шаблони атрибута `serialNumber`:<br>
**(PNOPL|PESEL).\*?(?<number>\\d{11})**<br>
**(TINPL|NIP).\*?(?<number>\\d{10})**<br>

#### Сертифікати кваліфікованої печатки (видаються для організацій)

Обов'язкові атрибути суб'єкта:<br/>
| Ідентифікатор (OID) | Назва                   | Значення                                                            |
|---------------------|-------------------------|---------------------------------------------------------------------|
| 2.5.4.10            | organizationName        | повна формальна назва суб'єкта, для якого видається сертифікат      |
| 2.5.4.97            | organizationIdentifier  | ідентифікатор суб'єкта                                              |
| 2.5.4.3             | commonName              | загальна назва організації                                          |
| 2.5.4.6             | countryName             | назва країни, код ISO 3166                                          |

Недопустимі атрибути суб'єкта:
| Ідентифікатор (OID) | Назва       | Значення |
|---------------------|------------ |----------|
| 2.5.4.42            | givenName   | ім'я     |  
| 2.5.4.4             | surname     | прізвище |

Розпізнавані шаблони атрибута `organizationIdentifier`:<br>
**(VATPL).\*?(?<number>\\d{10})**<br>

### Відбиток сертифіката

У випадку кваліфікованих сертифікатів, що не мають відповідних ідентифікаторів, записаних в атрибуті суб'єкта OID.2.5.4.5, можлива автентифікація таким сертифікатом після попереднього надання повноважень на геш SHA-256 (так званий відбиток) цього сертифіката.

Пов'язані документи: 
- [Автентифікація](../uwierzytelnianie.md)
