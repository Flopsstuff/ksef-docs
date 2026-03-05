---
original: dane-testowe-scenariusze.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [dane-testowe-scenariusze.md](https://github.com/CIRFMF/ksef-docs/blob/main/dane-testowe-scenariusze.md)

## Example Scenarios
05.08.2025

### Scenario 1 – Bailiff

If we want to use the KSeF system as an individual with bailiff privileges on the test environment, we need to add such person using the `/v2/testdata/person` endpoint, setting the *isBailiff* flag to **true**.

Example JSON:
```json
{
  "nip": "7980332920",
  "pesel": "30112206276",
  "description": "Komornik",
  "isBailiff": true
}
```

As a result of this operation, a person logging in within the context of the provided NIP, using the PESEL or NIP number, will receive owner (**Owner**) and enforcement (**EnforcementOperations**) permissions, which will enable using the system from a bailiff's perspective.

---

### Scenario 2 – Sole Proprietorship

If we want to use the KSeF system as a sole proprietorship on the test environment, we need to add such person using the `/v2/testdata/person` endpoint, setting the *isBailiff* flag to **false**.

Example JSON:
```json
{
  "nip": "7980332920",
  "pesel": "30112206276",
  "description": "JDG",
  "isBailiff": false
}
```

As a result of this operation, a person logging in within the context of the provided NIP, using the PESEL or NIP number, will receive owner (**Owner**) permission, which will enable using the system from a sole proprietorship perspective.

---

### Scenario 3 – VAT Group

If we want to create a VAT group structure and grant permissions to the group administrator and administrators of its members on the test environment, we need to first create the entity structure using the `/v2/testdata/subject` endpoint, specifying the NIP of the parent entity and subordinate entities.

Example JSON:
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

As a result of this operation, the specified entities and relationships between them will be created in the system. Next, some person needs to be granted permissions within the context of the VAT group's NIP, in accordance with ZAW-FA rules. This operation can be performed using the `/v2/testdata/permissions` method.

Example JSON for a person authorized within the context of a VAT group:
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

This operation can be performed both for VAT groups (as above) and for VAT group members. It should be noted that while for VAT groups this is the only way to grant initial permissions, for group members there is no such requirement. This can already be done using the standard endpoint /v2/permissions/subunit/grants by appointing administrators of VAT group members.

Alternatively, you can use the test data creation endpoint described above. Example JSON for granting `CredentialsManage` permission to a group member administrator:
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

Thanks to this operation, the representative of the VAT group member gains the ability to grant permissions to themselves or other people (e.g., employees) in the standard way, through the KSeF system.

### Scenario 4 – Enabling the Ability to Send Invoices with Attachments
On the test environment, you can simulate an entity that has the ability to send invoices with attachments enabled. The operation should be performed using the /testdata/attachment endpoint.

```json
{
  "nip": "4972530874"
}
```

As a result, the entity with NIP 4972530874 will receive the ability to send invoices containing attachments.

### Scenario 5 – Disabling the Ability to Send Invoices with Attachments
To test a situation where a given entity no longer has the ability to send invoices with attachments, you should use the /testdata/attachment/revoke endpoint.

```json
{
  "nip": "4972530874"
}
```

As a result, the entity with NIP 4972530874 loses the ability to send invoices containing attachments.
