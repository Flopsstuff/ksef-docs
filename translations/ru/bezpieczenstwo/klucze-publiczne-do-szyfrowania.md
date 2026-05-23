---
original: bezpieczenstwo/klucze-publiczne-do-szyfrowania.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: d92d285
last_translated: 2026-05-23
---

> **Translation.** Original: [bezpieczenstwo/klucze-publiczne-do-szyfrowania.md](https://github.com/CIRFMF/ksef-docs/blob/main/bezpieczenstwo/klucze-publiczne-do-szyfrowania.md)

# Открытые ключи для шифрования
05.05.2026

Документ описывает, каким образом KSeF публикует **открытые ключи, используемые для шифрования на стороне клиента**, как проходят процессы **ротации**, а также как правильно обработать сценарий переключения на новый ключ.

## 1. Введение

В выбранных операциях API, требующих шифрования на стороне клиента, передаваемые данные шифруются с использованием **открытого ключа** KSeF, предоставляемого в виде сертификата `X.509`.

## 2. Предоставление открытых ключей

Сертификаты открытых ключей предоставляются через endpoint:

- `GET /security/public-key-certificates`

Сертификат `X.509`, публикуемый API KSeF, выдается квалифицированным центром сертификации (CA).
В поле `Subject` сертификата указан субъект, которому принадлежит открытый ключ, в частности: `CN = Ministerstwo Finansów`.

Ответ содержит:

- `certificate` - сертификат `X.509` в формате `DER` (бинарном), закодированный в `Base64` (без заголовков BEGIN/END).
- `certificateId` - идентификатор сертификата (хеш **SHA-256** от DER сертификата, закодированный в формате `Base64`).
- `publicKeyId` - идентификатор ключа (хеш **SHA-256** от DER открытого ключа (`SubjectPublicKeyInfo`), содержащегося в сертификате, закодированный в формате `Base64`), используемый как селектор в вызовах, в которых клиент указывает, **какой открытый ключ использовался для шифрования**.
- `validFrom`, `validTo` - период действия сертификата.
- `usage` - назначение ключа (например, `KsefTokenEncryption`, `SymmetricKeyEncryption`).

Пример ответа:

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

## 3. Ротация сертификатов и ключей

В API KSeF публикуется сертификат `X.509`, содержащий открытый ключ.  
Публикация нового сертификата может быть результатом одной из двух ситуаций:

1. **Пере-сертификация** - публикуется новый сертификат для существующей пары ключей.
2. **Ротация ключа** - генерируется новая пара ключей, а вместе с ней публикуется новый сертификат, содержащий новый открытый ключ.  

### 3.1. Пере-сертификация (тот же ключ)

Пере-сертификация заключается в публикации нового сертификата `X.509` для того же открытого ключа.

В этом случае:

- пара ключей остается без изменений,
- `publicKeyId` остается без изменений,
- изменяется сертификат (`certificate`, `certificateId`, период действия).

Это плановый сценарий, чаще всего связанный с истечением срока действия сертификата.

#### Пример

Перед пере-сертификацией `GET /security/public-key-certificates` возвращает:

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

После пере-сертификации `GET /security/public-key-certificates` возвращает:

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

### 3.2. Ротация ключа (новый открытый ключ)

Ротация ключа означает генерацию новой пары ключей (открытого и закрытого). Реализации, использующие публикуемые ключи, должны быть всегда готовы к возможности ротации - также в аварийном режиме.

В стандартном режиме работы (при отсутствии инцидентов безопасности) не следует ожидать частых ротаций. Однако нельзя предполагать, что ключ останется неизменным на весь период функционирования системы.

В случае ротации ключа:

- генерируется новая пара ключей,
- изменяется `publicKeyId`,
- публикуется новый сертификат `X.509`, содержащий новый открытый ключ.

Типичные причины ротации ключа:

- подозрение на компрометацию или инцидент безопасности,
- изменение криптографических требований (например, алгоритм, параметры, размер ключа),
- требования соответствия или политик безопасности (циклическая ротация),
- операционные решения.

### 3.2.1. Плановая ротация

Плановая ротация является результатом принятой политики безопасности, требований соответствия или циклической смены ключей.

В случае плановой ротации новый сертификат может быть опубликован заранее.  
В переходном периоде API будет возвращать как минимум два сертификата для того же `usage`:
- существующий сертификат,
- новый сертификат, содержащий новый открытый ключ.

После завершения переходного периода предыдущий сертификат будет удален из списка.

#### Пример - плановая ротация

Перед ротацией `GET /security/public-key-certificates` возвращает:

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

После ротации `GET /security/public-key-certificates` возвращает:

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

### 3.2.2. Аварийная ротация (инцидент безопасности)

Аварийная ротация может быть проведена в случае подозрения на компрометацию закрытого ключа или другого инцидента безопасности.

В таком случае:  
- закрытый ключ перестает использоваться для криптографических операций на стороне KSeF,
- связанные с ним сертификаты `X.509` отзываются (revoked) у поставщика сертификатов (CA),
- сертификаты, связанные с отозванным ключом, перестают возвращаться endpoint'ом `GET /security/public-key-certificates`,
- существующий `publicKeyId` перестает приниматься API,
- публикуется новый сертификат, содержащий новый открытый ключ.

### Пример - аварийная ротация

Перед ротацией `GET /security/public-key-certificates` возвращает:

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

После ротации `GET /security/public-key-certificates` возвращает:


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

## 4. Сценарий использования

### 4.1. Получение сертификатов

1. Клиент вызывает:
   - `GET /security/public-key-certificates`
2. Клиент выбирает сертификат, подходящий для `usage` (например, `KsefTokenEncryption` или `SymmetricKeyEncryption`), действительный на момент операции; в случае нескольких действительных сертификатов предпочитает сертификат с наиболее поздней датой `validFrom`.
3. Клиент шифрует данные, используя **открытый ключ** из выбранного сертификата.

### 4.2. Передача селектора `publicKeyId` в выбранные endpoints

`publicKeyId` передается в модели запроса в endpoints, для которых система должна однозначно определить, каким открытым ключом клиент выполнил шифрование.

Это касается:
- `POST /auth/ksef-token`
- `POST /sessions/online`
- `POST /sessions/batch`,
- `POST /invoices/exports`.

### 4.3. Валидация на стороне KSeF

Endpoint проверяет: 
- известен ли `publicKeyId` для данного `usage`,
- является ли указанный ключ в данный момент приемлемым (действителен и не отозван).

Если ключ не принимается, API возвращает ошибку:
  - HTTP `400`
  - code: `21470` - Переданный идентификатор ключа неизвестен или указывает на отозванный ключ.

### 4.4. Обработка ошибки 21470

Если клиент получает ошибку `21470`:  
1. Повторно получает список:
   - `GET /security/public-key-certificates`
2. Выбирает актуальный сертификат для данного `usage` (например, `KsefTokenEncryption` или `SymmetricKeyEncryption`), действительный на момент операции; в случае нескольких действительных сертификатов предпочитает сертификат с наиболее поздней датой `validFrom`.
3. Повторяет операцию с использованием нового ключа (новый `publicKeyId`).
