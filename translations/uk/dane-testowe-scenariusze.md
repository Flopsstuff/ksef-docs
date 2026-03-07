---
original: dane-testowe-scenariusze.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [dane-testowe-scenariusze.md](https://github.com/CIRFMF/ksef-docs/blob/main/dane-testowe-scenariusze.md)

## Приклади сценаріїв
05.08.2025

### Сценарій № 1 – Судовий пристав

Якщо у тестовому середовищі ми хочемо користуватися системою KSeF як фізична особа з повноваженнями судового пристава, необхідно додати таку особу за допомогою ендпоінту `/v2/testdata/person`, встановивши прапорець *isBailiff* на **true**.

Приклад JSON:
```json
{
  "nip": "7980332920",
  "pesel": "30112206276",
  "description": "Komornik",
  "isBailiff": true
}
```

В результаті цієї операції особа, що входить до системи в контексті зазначеного NIP-у, за допомогою номера PESEL або NIP-у, отримає власницькі повноваження (**Owner**) та виконавчі повноваження (**EnforcementOperations**), що дозволить користуватися системою з перспективи судового пристава.

---

### Сценарій № 2 – JDG

Якщо у тестовому середовищі ми хочемо користуватися системою KSeF як одноособове господарське підприємство, необхідно додати таку особу за допомогою ендпоінту `/v2/testdata/person`, встановивши прапорець *isBailiff* на **false**.

Приклад JSON:
```json
{
  "nip": "7980332920",
  "pesel": "30112206276",
  "description": "JDG",
  "isBailiff": false
}
```

В результаті цієї операції особа, що входить до системи в контексті зазначеного NIP-у, за допомогою номера PESEL або NIP-у, отримає власницькі повноваження (**Owner**), що дозволить користуватися системою з перспективи JDG.

---

### Сценарій № 3 – Група VAT

Якщо у тестовому середовищі ми хочемо створити структуру групи VAT та надати повноваження адміністратору групи та адміністраторам її учасників, необхідно на першому кроці створити структуру суб'єктів за допомогою ендпоінту `/v2/testdata/subject`, вказавши NIP головної одиниці та підпорядкованих одиниць.

Приклад JSON:
```json
{
  "subjectNip": "3755747347",
  "subjectType": "VatGroup",
  "description": "Grupa VAT",
  "subunits": [
    {
      "subjectNip": "4972530874",
      "description": "NIP 4972530874: członek grupy VAT dla 3755747347"
    },
    {
      "subjectNip": "8225900795",
      "description": "NIP 8225900795: członek grupy VAT dla 3755747347"
    }
  ]
}
```

В результаті цієї операції в системі будуть створені зазначені суб'єкти та зв'язки між ними. Далі необхідно якійсь особі надати повноваження в контексті NIP-у групи VAT, відповідно до правил ZAW-FA. Цю операцію можна виконати за допомогою методу `/v2/testdata/permissions`.

Приклад JSON для особи, уповноваженої в контексті групи VAT:
```json
{
  "contextIdentifier": {
    "value": "3755747347",
    "type": "nip"
  },
  "authorizedIdentifier": {
    "value": "38092277125",
    "type": "pesel"
  },
  "permissions": [
    {
      "permissionType": "InvoiceRead",
      "description": "praca w kontekście 3755747347: uprawniony PESEL: 38092277125, Adam Abacki"
    },
    {
      "permissionType": "InvoiceWrite",
      "description": "praca w kontekście 3755747347: uprawniony PESEL: 38092277125, Adam Abacki"
    },
    {
      "permissionType": "Introspection",
      "description": "praca w kontekście 3755747347: uprawniony PESEL: 38092277125, Adam Abacki"
    },
    {
      "permissionType": "CredentialsRead",
      "description": "praca w kontekście 3755747347: uprawniony PESEL: 38092277125, Adam Abacki"
    },
    {
      "permissionType": "CredentialsManage",
      "description": "praca w kontekście 3755747347: uprawniony PESEL: 38092277125, Adam Abacki"
    },
    {
      "permissionType": "SubunitManage",
      "description": "praca w kontekście 3755747347: uprawniony PESEL: 38092277125, Adam Abacki"
    }
  ]
}
```

Таку операцію можна виконати як для групи VAT (як вище), так і для учасників групи VAT. Слід зауважити, що якщо для групи VAT це єдина можливість надання початкових повноважень, то для учасників групи такої необхідності немає. Це можна зробити вже за допомогою стандартного ендпоінту /v2/permissions/subunit/grants, призначивши адміністраторів учасників групи VAT.

Альтернативно можна скористатися описаним вище ендпоінтом для створення тестових даних. Приклад JSON для надання повноваження `CredentialsManage` адміністратору учасника групи:
```json
{
  "contextIdentifier": {
    "value": "4972530874",
    "type": "nip"
  },
  "authorizedIdentifier": {
    "value": "3388912629",
    "type": "nip"
  },
  "permissions": [
    {
      "permissionType": "CredentialsManage",
      "description": "praca w kontekście 4972530874: uprawniony NIP: 3388912629, Bogdan Babacki"
    }
  ]
}
```

Завдяки цій операції представник учасника групи VAT отримує можливість надавати повноваження собі або іншим особам (наприклад, працівникам) у стандартний спосіб, через систему KSeF.

### Сценарій № 4 – Увімкнення можливості відправлення рахунків-фактур з додатками
У тестовому середовищі можна симулювати суб'єкт, у якого увімкнена можливість пересилання рахунків-фактур з додатками. Операцію необхідно виконати за допомогою ендпоінту /testdata/attachment.

```json
{
  "nip": "4972530874"
}
```

В результаті суб'єкт з NIP 4972530874 отримає можливість пересилання рахунків-фактур, що містять додатки.

### Сценарій № 5 – Вимкнення можливості відправлення рахунків-фактур з додатками
Щоб протестувати ситуацію, в якій дана одиниця більше не має можливості пересилати рахунки-фактури з додатками, необхідно використовувати ендпоінт /testdata/attachment/revoke.

```json
{
  "nip": "4972530874"
}
```

В результаті суб'єкт з NIP 4972530874 втрачає можливість пересилання рахунків-фактур, що містять додатки
