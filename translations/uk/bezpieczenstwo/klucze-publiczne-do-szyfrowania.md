---
original: bezpieczenstwo/klucze-publiczne-do-szyfrowania.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: d92d285
last_translated: 2026-05-23
---

> **Translation.** Original: [bezpieczenstwo/klucze-publiczne-do-szyfrowania.md](https://github.com/CIRFMF/ksef-docs/blob/main/bezpieczenstwo/klucze-publiczne-do-szyfrowania.md)

# Публічні ключі для шифрування
05.05.2026

Документ описує, яким чином KSeF публікує **публічні ключі, що використовуються для шифрування на стороні клієнта**, як відбуваються процеси **ротації** та як правильно обробити сценарій переключення на новий ключ.

## 1. Вступ

В окремих операціях API, що вимагають шифрування на стороні клієнта, передані дані шифруються за допомогою **публічного ключа** KSeF, що надається у вигляді сертифіката `X.509`.

## 2. Надання публічних ключів

Сертифікати публічних ключів надаються за допомогою ендпоінту:

- `GET /security/public-key-certificates`

Сертифікат `X.509`, що публікується API KSeF, видається кваліфікованим центром сертифікації (CA).
У полі `Subject` сертифіката зазначено суб'єкт, якого стосується публічний ключ, зокрема: `CN = Ministerstwo Finansów`.

Відповідь містить:

- `certificate` — сертифікат `X.509` у форматі `DER` (бінарному), закодований у `Base64` (без заголовків BEGIN/END).
- `certificateId` — ідентифікатор сертифіката (хеш **SHA-256** з DER сертифіката, закодований у форматі `Base64`).
- `publicKeyId` — ідентифікатор ключа (хеш **SHA-256** з DER публічного ключа (`SubjectPublicKeyInfo`), що міститься в сертифікаті, закодований у форматі `Base64`), використовується як селектор у викликах, у яких клієнт вказує, **яким публічним ключем він скористався для шифрування**.
- `validFrom`, `validTo` — термін дії сертифіката.
- `usage` — призначення ключа (наприклад, `KsefTokenEncryption`, `SymmetricKeyEncryption`).

Приклад відповіді:

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

## 3. Ротація сертифікатів і ключів

В API KSeF публікується сертифікат `X.509`, що містить публічний ключ.  
Публікація нового сертифіката може бути зумовлена однією з двох ситуацій:

1. **Ресертифікація** — публікується новий сертифікат для наявної пари ключів.
2. **Ротація ключа** — генерується нова пара ключів, а разом з нею публікується новий сертифікат, що містить новий публічний ключ.

### 3.1. Ресертифікація (той самий ключ)

Ресертифікація полягає у публікації нового сертифіката `X.509` для того самого публічного ключа.

У цьому випадку:

- пара ключів залишається без змін,
- `publicKeyId` залишається без змін,
- змінюється сертифікат (`certificate`, `certificateId`, термін дії).

Це плановий сценарій, який найчастіше пов'язаний із закінченням терміну дії сертифіката.

#### Приклад

До ресертифікації `GET /security/public-key-certificates` повертає:

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

Після ресертифікації `GET /security/public-key-certificates` повертає:

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

### 3.2. Ротація ключа (новий публічний ключ)

Ротація ключа означає генерацію нової пари ключів (публічного та приватного). Реалізації, що використовують опубліковані ключі, завжди повинні бути готові до можливості ротації — зокрема в аварійному режимі.

У стандартному режимі роботи (за відсутності інцидентів безпеки) не слід очікувати частих ротацій. Однак не можна припускати, що ключ залишиться незмінним протягом усього терміну функціонування системи.

У разі ротації ключа:

- генерується нова пара ключів,
- `publicKeyId` змінюється,
- публікується новий сертифікат `X.509`, що містить новий публічний ключ.

Типові причини ротації ключа:

- підозра на компрометацію або інцидент безпеки,
- зміна криптографічних вимог (наприклад, алгоритм, параметри, розмір ключа),
- вимоги відповідності або політик безпеки (циклічна ротація),
- операційні рішення.

### 3.2.1. Планова ротація

Планова ротація зумовлена прийнятою політикою безпеки, вимогами відповідності або циклічною заміною ключів.

У разі планової ротації новий сертифікат може бути опублікований завчасно.  
У перехідний період API повертатиме щонайменше два сертифікати для одного й того самого `usage`:
- наявний сертифікат,
- новий сертифікат, що містить новий публічний ключ.

Після завершення перехідного періоду попередній сертифікат буде видалено зі списку.

#### Приклад — планова ротація

До ротації `GET /security/public-key-certificates` повертає:

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

Після ротації `GET /security/public-key-certificates` повертає:

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

### 3.2.2. Аварійна ротація (інцидент безпеки)

Аварійна ротація може бути проведена у разі підозри на компрометацію приватного ключа або іншого інциденту безпеки.

У такому випадку:  
- приватний ключ припиняє використовуватися для криптографічних операцій на стороні KSeF,
- пов'язані з ним сертифікати `X.509` відкликаються (revoked) у постачальника сертифікатів (CA),
- сертифікати, пов'язані з відкликаним ключем, перестають повертатися ендпоінтом `GET /security/public-key-certificates`,
- попередній `publicKeyId` перестає прийматися API,
- публікується новий сертифікат, що містить новий публічний ключ.

### Приклад — аварійна ротація

До ротації `GET /security/public-key-certificates` повертає:

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

Після ротації `GET /security/public-key-certificates` повертає:

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

## 4. Сценарій використання

### 4.1. Отримання сертифікатів

1. Клієнт викликає:
   - `GET /security/public-key-certificates`
2. Клієнт вибирає сертифікат, відповідний для `usage` (наприклад, `KsefTokenEncryption` або `SymmetricKeyEncryption`), що діє на момент операції; у разі наявності кількох дійсних сертифікатів надає перевагу сертифікату з найпізнішою датою `validFrom`.
3. Клієнт шифрує дані, використовуючи **публічний ключ** з обраного сертифіката.

### 4.2. Передача селектора `publicKeyId` до вибраних ендпоінтів

`publicKeyId` передається в моделі запиту до ендпоінтів, для яких система повинна однозначно визначити, яким публічним ключем клієнт виконав шифрування.

Це стосується:
- `POST /auth/ksef-token`
- `POST /sessions/online`
- `POST /sessions/batch`,
- `POST /invoices/exports`.

### 4.3. Валідація на стороні KSeF

Ендпоінт перевіряє: 
- чи відомий `publicKeyId` для даного `usage`,
- чи є вказаний ключ наразі прийнятним (дійсним і не відкликаним).

Якщо ключ не є прийнятним, API повертає помилку:
  - HTTP `400`
  - code: `21470` — Надісланий ідентифікатор ключа невідомий або вказує на відкликаний ключ.

### 4.4. Обробка помилки 21470

Якщо клієнт отримав помилку `21470`:  
1. Повторно отримує список:
   - `GET /security/public-key-certificates`
2. Вибирає актуальний сертифікат для даного `usage` (наприклад, `KsefTokenEncryption` або `SymmetricKeyEncryption`), що діє на момент операції; у разі наявності кількох дійсних сертифікатів надає перевагу сертифікату з найпізнішою датою `validFrom`.
3. Повторює операцію з використанням нового ключа (новий `publicKeyId`).
