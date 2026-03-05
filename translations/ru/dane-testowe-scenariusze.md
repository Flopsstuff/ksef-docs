---
original: dane-testowe-scenariusze.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [dane-testowe-scenariusze.md](https://github.com/CIRFMF/ksef-docs/blob/main/dane-testowe-scenariusze.md)

## Примеры сценариев
05.08.2025

### Сценарий № 1 – Судебный исполнитель

Если в тестовой среде мы хотим использовать систему KSeF как физическое лицо с полномочиями судебного исполнителя, необходимо добавить такое лицо с помощью endpoint `/v2/testdata/person`, установив флаг *isBailiff* в **true**.

Пример JSON:
```json
{
  "nip": "7980332920",
  "pesel": "30112206276",
  "description": "Komornik",
  "isBailiff": true
}
```

В результате этой операции лицо, входящее в систему в контексте указанного NIP, с помощью номера PESEL или NIP, получает полномочия владельца (**Owner**) и исполнительные полномочия (**EnforcementOperations**), что позволяет использовать систему с точки зрения судебного исполнителя.

---

### Сценарий № 2 – ИП

Если в тестовой среде мы хотим использовать систему KSeF как индивидуальная хозяйственная деятельность, необходимо добавить такое лицо с помощью endpoint `/v2/testdata/person`, установив флаг *isBailiff* в **false**.

Пример JSON:
```json
{
  "nip": "7980332920",
  "pesel": "30112206276",
  "description": "JDG",
  "isBailiff": false
}
```

В результате этой операции лицо, входящее в систему в контексте указанного NIP, с помощью номера PESEL или NIP, получает полномочия владельца (**Owner**), что позволяет использовать систему с точки зрения ИП.

---

### Сценарий № 3 – Группа НДС

Если в тестовой среде мы хотим создать структуру группы НДС и предоставить полномочия администратору группы и администраторам её членов, необходимо в первую очередь создать структуру субъектов с помощью endpoint `/v2/testdata/subject`, указав NIP вышестоящего подразделения и подчиненных подразделений.

Пример JSON:
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

В результате этой операции в системе будут созданы указанные субъекты и связи между ними. Затем необходимо предоставить какому-либо лицу полномочия в контексте NIP группы НДС, согласно правилам ZAW-FA. Эту операцию можно выполнить с помощью метода `/v2/testdata/permissions`.

Пример JSON для лица, уполномоченного в контексте группы НДС:
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

Такую операцию можно выполнить как для группы НДС (как выше), так и для членов группы НДС. Следует отметить, что если для группы НДС это единственная возможность предоставления первоначальных полномочий, то для членов группы в этом нет необходимости. Это уже можно сделать, используя стандартный endpoint /v2/permissions/subunit/grants, назначив администраторов членов группы НДС.

Альтернативно можно воспользоваться описанным выше endpoint для создания тестовых данных. Пример JSON для предоставления полномочия `CredentialsManage` администратору члена группы:
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

Благодаря этой операции представитель члена группы НДС получает возможность предоставлять полномочия себе или другим лицам (например, сотрудникам) стандартным способом через систему KSeF.

### Сценарий № 4 – Включение возможности отправки счетов-фактур с приложением
В тестовой среде можно смоделировать субъект, который имеет включенную возможность передачи счетов-фактур с приложениями. Операцию следует выполнить с помощью endpoint /testdata/attachment.

```json
{
  "nip": "4972530874"
}
```

В результате субъект с NIP 4972530874 получает возможность передачи счетов-фактур, содержащих приложения.

### Сценарий № 5 – Отключение возможности отправки счетов-фактур с приложением
Чтобы протестировать ситуацию, в которой данное подразделение больше не имеет возможности передачи счетов-фактур с приложениями, следует использовать endpoint /testdata/attachment/revoke.

```json
{
  "nip": "4972530874"
}
```

В результате субъект с NIP 4972530874 теряет возможность передачи счетов-фактур, содержащих приложения
