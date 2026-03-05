---
original: uprawnienia.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [uprawnienia.md](https://github.com/CIRFMF/ksef-docs/blob/main/uprawnienia.md)

## Права доступа
10.07.2025

### Введение – бизнес-контекст
Система KSeF внедряет продвинутый механизм управления правами доступа, который составляет основу безопасного и соответствующего требованиям законодательства использования системы различными субъектами. Права доступа определяют, кто может выполнять определенные операции в KSeF – такие как выставление счетов-фактур, просмотр документов, предоставление дополнительных прав доступа или управление подчиненными подразделениями.

### Цели управления правами доступа:
- Безопасность данных – ограничение доступа к информации только для лиц и субъектов, которые формально к этому уполномочены.
- Соответствие требованиям законодательства – обеспечение того, что операции выполняются надлежащими подразделениями в соответствии с законодательными требованиями (например, Закон об НДС).
- Аудируемость – каждая операция, связанная с предоставлением или отзывом прав доступа, регистрируется и может быть подвергнута анализу.

### Кто предоставляет права доступа?
Права доступа могут предоставляться:

- владельцем субъекта - роль (Owner),
- администратором подчиненного субъекта,
- администратором подчиненного подразделения,
- администратором субъекта ЕС,
- администратором субъекта, то есть другим субъектом или лицом, обладающим правом доступа CredentialsManage.

На практике это означает, что каждая организация должна управлять правами доступа своих сотрудников, например, предоставлять права доступа сотруднику отдела бухгалтерии при принятии нового сотрудника или отзывать права доступа, когда такой сотрудник прекращает трудовые отношения.

### Когда предоставляются права доступа?
#### Примеры:
- при начале сотрудничества с новым сотрудником,
- в случае, когда фирма вступает в сотрудничество, например, с бухгалтерской фирмой, она должна предоставить права доступа для чтения счетов-фактур этой бухгалтерской фирме, чтобы эта фирма могла обрабатывать счета-фактуры данной компании,
- в связи с изменениями отношений между субъектами.

### Структура предоставленных прав доступа:
Права доступа предоставляются:
1) Физическим лицам, идентифицируемым по PESEL, NIP или отпечатку сертификата – для работы в KSeF:
    - в контексте субъекта, предоставляющего право доступа (права доступа, предоставляемые непосредственно) или
    - в контексте другого субъекта или других субъектов:
        - в контексте подчиненного субъекта, идентифицируемого по NIP (подчиненного подразделения органов местного самоуправления или члена группы НДС),
        - в контексте подчиненного подразделения, идентифицируемого внутренним идентификатором,
        - в составном контексте NIP-VAT UE, связывающем польский субъект с субъектом ЕС, уполномоченным на самовыставление счетов-фактур от имени этого польского субъекта,
        - в контексте указанного субъекта, идентифицируемого по NIP – клиента субъекта, предоставляющего права доступа (селективные права доступа, предоставляемые косвенным образом),
        - в контексте всех субъектов – клиентов субъекта, предоставляющего права доступа (общие права доступа, предоставляемые косвенным образом).
2) Другим субъектам – идентифицируемым по NIP:
    - как конечным получателям прав доступа на выставление или просмотр счетов-фактур,
    - как посредникам - с включенной опцией разрешения на дальнейшую передачу прав доступа, чтобы уполномоченный субъект имел возможность предоставлять права доступа косвенным образом (см. п. IV и V выше).

3) Другим субъектам для действий в своем контексте от имени уполномочивающего субъекта (субъектные права доступа):
    - налоговым представителям,
    - субъектам, уполномоченным на самовыставление счетов-фактур,
    - субъектам, уполномоченным на выставление счетов-фактур НДС RR.

Доступ к функциям системы зависит от контекста, в котором произошла аутентификация, и от объема прав доступа, предоставленных аутентифицированному субъекту/лицу в этом контексте.

##  Словарь понятий (в области прав доступа KSeF)

| Термин                          | Определение |
|---------------------------------|-----------|
| **Право доступа**                 | Разрешение на выполнение определенных операций в KSeF, например, `InvoiceWrite`, `CredentialsManage`. |
| **Владелец**                       | Владелец субъекта – лицо, имеющее по умолчанию полный доступ к операциям в контексте субъекта, имеющего такой же идентификатор NIP, какой записан в используемом средстве аутентификации; для владельца также действует связь NIP-PESEL, поэтому он может аутентифицироваться также средством, содержащим связанный номер PESEL, сохраняя все права доступа владельца. |
| **Администратор подчиненного субъекта**              | Лицо с правами доступа на управление правами доступа (`CredentialsManage`) в контексте подчиненного субъекта. Может предоставлять права доступа (например, `InvoiceWrite`). Подчиненным субъектом может быть, например, член группы НДС. |
| **Администратор подчиненного подразделения**              | Лицо с правами доступа на управление правами доступа (`CredentialsManage`) в подчиненном подразделении. Может предоставлять права доступа (например, `InvoiceWrite`). |
| **Администратор субъекта ЕС**              | Лицо с правами доступа на управление правами доступа (`CredentialsManage`) в составном контексте, идентифицируемом с помощью NipVatUe. Может предоставлять права доступа (например, `InvoiceRead`). |
| **Субъект-посредник**   | Субъект, который получил право доступа с флагом `canDelegate = true` и может передать это право доступа дальше, то есть предоставить право доступа косвенным образом. Это могут быть только права доступа `InvoiceWrite` и `InvoiceRead`. |
| **Целевой субъект**  | Субъект, в контексте которого действует данное право доступа – например, фирма, обслуживаемая бухгалтерской фирмой. |
| **Предоставленное непосредственно**       | Право доступа, предоставленное напрямую данному пользователю или субъекту владельцем или администратором. |
| **Предоставление косвенным образом**          | Право доступа, предоставленное посредником для обслуживания другого субъекта – только для `InvoiceRead` и `InvoiceWrite`. |
| **`canDelegate`**              | Техническая флага (`true` / `false`), позволяющая делегировать права доступа. Только `InvoiceRead` и `InvoiceWrite` могут иметь `canDelegate = true`. Может использоваться только при предоставлении права доступа субъекту для обслуживания счетов-фактур |
| **`subjectIdentifier`**        | Данные, идентифицирующие получателя прав доступа (лицо или субъект): `Nip`, `Pesel`, `Fingerprint`. |
| **`targetIdentifier` / `contextIdentifier`** | Данные, идентифицирующие контекст, в котором действует предоставленное право доступа – например, NIP клиента, внутренний идентификатор организационного подразделения. |
| **Fingerprint**                | Результат вычисления хэш-функции SHA-256 на квалифицированном сертификате. Позволяет распознать сертификат субъекта, обладающего правом доступа, предоставленным на отпечаток сертификата. Используется, в частности, при идентификации лиц или зарубежных субъектов. |
| **InternalId**                 | Внутренний идентификатор подчиненного подразделения в системе KSeF - двухчастный идентификатор, состоящий из номера NIP и пяти цифр `nip-5_cyfr`.  |
| **NipVatUe**                   | Составной идентификатор, то есть двухчастный идентификатор, состоящий из номера NIP польского субъекта и номера НДС ЕС субъекта ЕС, которые разделены с помощью разделителя `nip-vat_ue`. |
| **Отзыв**                     | Операция отзыва ранее предоставленного права доступа. |
| **`permissionId`**             | Технический идентификатор предоставленного права доступа – требуется, в частности, при операциях отзыва. |
| **`operationReferenceNumber`** | Идентификатор операции (например, предоставления или отзыва прав доступа), возвращаемый API, используемый для проверки статуса. |
| **Статус операции**            | Текущее состояние процесса предоставления/отзыва прав доступа: `100`, `200`, `400` и т.д. |

## Модель ролей и прав доступа (матрица прав доступа)

Система KSeF позволяет присваивать права доступа точным образом, с учетом видов деятельности, выполняемых пользователями. Права доступа могут предоставляться как непосредственно, так и косвенно – в зависимости от механизма делегирования доступа.

### Примеры ролей для отображения с помощью прав доступа:

| Роль / субъект                          | Описание роли                                                                                          | Возможные права доступа                                                                 |
|----------------------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| **Владелец субъекта**      | Роль, автоматически принадлежащая по умолчанию владельцу. Чтобы быть распознанным системой как владелец, необходимо аутентифицироваться вектором с таким же идентификатором NIP как NIP контекста входа или связанным номером PESEL           | Роль `Owner`, включающая все права доступа на счета-фактуры и административные права за исключением `VatUeManage`. |
| **Администратор субъекта**            | Физическое лицо, обладающее правами на предоставление и отзыв прав доступа другим пользователям и/или назначение администраторов подразделений/подчиненных субъектов.           | `CredentialsManage`, `SubunitManage`, `Introspection`.                              |
| **Оператор (бухгалтерия / выставление счетов)** | Лицо, ответственное за выставление или просмотр счетов-фактур.                                        | `InvoiceWrite`, `InvoiceRead`.                                                      |
| **Уполномоченный субъект**                | Другой хозяйственный субъект, которому предоставлены определенные права доступа на выставление счетов-фактур от имени субъекта, например, налоговый представитель.             | `SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`                             |
| **Субъект-посредник**              | Субъект, который получил права доступа с опцией делегации (`canDelegate`) и может предоставить их дальше.       | `InvoiceRead`, `InvoiceWrite` с флагом `canDelegate = true`.   
| **Администратор субъекта ЕС**     | Лицо, идентифицирующееся сертификатом, обладающее правами на предоставление и отзыв прав доступа другим пользователям в рамках субъекта ЕС, связанного с данным польским субъектом.                                     | `InvoiceWrite`, `InvoiceRead`,                                    `VatUeManage`,  `Introspection`.                      |                      |
| **Представитель субъекта ЕС**     | Лицо, идентифицирующееся сертификатом, действующее от имени субъекта ЕС, связанного с данным польским субъектом.                                     | `InvoiceWrite`, `InvoiceRead`.                                                      |
| **Администратор подчиненного подразделения** | Пользователь, имеющий возможность назначать администраторов в подчиненных подразделениях или субъектах.               | `CredentialsManage`.                                                                    |

---

### Классификация прав доступа по типу:

| Тип права доступа           | Примерные значения                                       | Возможность предоставления косвенным образом | Операционное описание                                                              |
|--------------------------|------------------------------------------------------------|-------------------------------|------------------------------------------------------------------------------|
| **По счетам-фактурам**             | `InvoiceWrite`, `InvoiceRead`                              | ✔️ (если `canDelegate=true`) | Операции со счетами-фактурами: отправка, получение                     |
| **Административные**       | `CredentialsManage`, `SubunitManage`,  `VatUeManage`.                       | ❌                            | Управление правами доступа, подчиненными подразделениями                      |
| **Субъектные**        | `SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`        | ❌                            | Уполномочивание других субъектов на действия (выставление счетов-фактур) в собственном контексте от имени уполномочивающего субъекта         |
| **Технические**            | `Introspection`                                            | ❌                            | Доступ к истории операций и сессий                                         |

---

## Общие и селективные права доступа

Система KSeF позволяет предоставлять выбранные права доступа **общим (генеральным)** или **селективным (индивидуальным)** образом, что позволяет гибко управлять доступом к данным многих бизнес-партнеров.

###  Селективные (индивидуальные) права доступа

Селективные права доступа – это такие, которые предоставляются субъектом-посредником (например, бухгалтерской фирмой) в отношении **конкретного целевого субъекта (партнера)**. Позволяют ограничить область доступа только выбранным клиентом или организационным подразделением.

**Пример:**  
Бухгалтерская фирма XYZ получила от фирмы ABC право доступа `InvoiceRead` с флагом `canDelegate = true`. Теперь она может передать это право доступа своему сотруднику, но только в контексте фирмы ABC – другие фирмы, обслуживаемые XYZ, не охвачены этим доступом.

**Характеристики селективности:**
- Необходимо указание `targetIdentifier` (например, `Nip` партнера).
- Получатель права доступа действует только в контексте указанного субъекта.
- Не дает доступа к данным других партнеров субъекта-посредника.

---

###  Общие (генеральные) права доступа

Общие права доступа – это такие, которые предоставляются без указания конкретного партнера, что означает, что получатель получает доступ к операциям в контексте **всех субъектов, данные которых обрабатывает субъект-посредник**.

**Пример:**
Субъект A обладает правом доступа `InvoiceRead` с `canDelegate = true` для многих клиентов. Передает сотруднику B общее право доступа `InvoiceRead` – B может теперь действовать от имени каждого из клиентов A (например, просматривать счета-фактуры всех контрагентов).

**Характеристики генеральности:**
- Тип идентификатора целевого субъекта `targetIdentifier` это `AllPartners`.
- Доступ охватывает всех субъектов, обслуживаемых посредником.
- Применяется в случае массовой интеграции, больших центров общих услуг или бухгалтерских систем.

---

### Технические замечания и ограничения

- Механизм касается только прав доступа `InvoiceRead` и `InvoiceWrite`, предоставляемых косвенным образом.
- На практике разница заключается в наличии (селективные) или отсутствии (общие) субъекта `targetIdentifier` в теле запроса `POST /permissions/indirect/grants`.
- Система не позволяет объединить в одном вызове предоставление общего и селективного – необходимо выполнить отдельные операции.
- Общие права доступа должны применяться с осторожностью, особенно в производственных средах, ввиду их широкого охвата.

---

### Структура присвоения прав доступа:

1. **Непосредственное предоставление** – например, администратор субъекта A присваивает пользователю право доступа `InvoiceWrite` физическому лицу в контексте субъекта A.
2. **Предоставление с возможностью дальнейшей передачи** – например, администратор субъекта A предоставляет субъекту B (посреднику) право доступа `InvoiceRead` с `canDelegate=true`, что позволяет администратору субъекта B предоставить `InvoiceRead` субъекту/лицу C.
3. **Предоставление косвенным образом** – с использованием выделенного эндпоинта /permissions/indirect/grants, где администратор субъекта-посредника B, который получил от субъекта A право доступа с делегацией, предоставляет права доступа от имени для обслуживания целевого субъекта A субъекту/лицу C.

---

### Пример матрицы прав доступа:

| Пользователь / Субъект       | InvoiceWrite | InvoiceRead | CredentialsManage | SubunitManage | TaxRepresentative |
|----------------------------|--------------|-------------|--------------------|----------------|--------------------|
| Анна Ковальская (PESEL)      | ✅           | ✅          | ❌                 | ❌             | ❌                 |
| Бухгалтерская фирма XYZ (NIP) | ✅ (с делегацией)          | ✅ (с делегацией) | ❌                 | ❌             | ❌                 |
| Ян Новак (идентифицирующийся сертификатом)   | ✅           | ✅          | ❌                 | ❌             | ❌                 |
| Администратор отдела бухгалтерии (PESEL)           | ❌           | ❌          | ✅                 | ✅             | ❌                 |
| Материнская компания, т.е. owner (NIP)         | ✅           | ✅          | ✅                 | ✅             | ✅                 |
| Администратор группы НДС (PESEL)          | ❌           | ❌          | ❌                 | ✅             | ❌                 |
| Налоговый представитель (NIP)          | ❌           | ❌          | ❌                 | ❌             | ✅                 |

---

### Роли или права доступа, требуемые для предоставления прав доступа 

| Предоставление прав доступа:                        | Требуемая роль или право доступа                      |
|-------------------------------------------|---------------------------------------------------|
| физическому лицу для работы в KSeF      | `Owner` или `CredentialsManage`                   |
| субъекту для обслуживания счетов-фактур           | `Owner` или `CredentialsManage`                   |
| субъектных | `Owner` или `CredentialsManage`                   |
| для обслуживания счетов-фактур  – косвенным образом              | `Owner` или `CredentialsManage`    |
| администратору подчиненного подразделения   | `SubunitManage`                                   |
| администратору субъекта ЕС      | `Owner` или `CredentialsManage`    |
| представителю субъекта ЕС     | `VatUeManage`    |
---

### Ограничения идентификаторов (`subjectIdentifier`, `contextIdentifier`)

| Тип идентификатора | Идентифицируемый | Замечания |
|--------------------|---------------------|-------|
| `Nip`              | Отечественный субъект     | Для субъектов, зарегистрированных в Польше, а также физических лиц |
| `Pesel`            | Физическое лицо       | Требуется, в частности, при предоставлении прав доступа сотрудникам, пользующимся доверенным профилем или квалифицированным сертификатом с номером PESEL  |
| `Fingerprint`      | Владелец сертификата      | Используется в ситуации, когда квалифицированный сертификат не содержит идентификатор NIP или PESEL, а также при идентификации администраторов или представителей субъектов ЕС   |
| `NipVatUe`         | Субъекты ЕС, связанные с польскими субъектами       | Требуется при предоставлении прав доступа администраторам и представителям субъектов ЕС |
| `InternalId`       | Подчиненные подразделения  | Используется в субъектах со сложной структурой из подчиненных подразделений |

---

### Функциональные ограничения API

- Нельзя предоставить одно и то же право доступа дважды – API может вернуть ошибку или проигнорировать дубликат.
- Выполнение операции предоставления права доступа не приводит к немедленному доступу – операция асинхронна и должна быть правильно обработана системой (следует проверить статус операции).

---

### Временные ограничения

- Предоставленное право доступа остается активным до момента его отзыва.
- Внедрение временного ограничения требует логики со стороны клиентской системы (например, расписание отзыва права доступа).


## Предоставление прав доступа


### Предоставление прав доступа физическим лицам для работы в KSeF.

В рамках организаций, использующих KSeF, возможно предоставление прав доступа конкретным физическим лицам – например, сотрудникам отдела бухгалтерии или IT. Права доступа присваиваются лицу на основе его идентификатора (PESEL, NIP или Fingerprint). Права доступа могут включать как операционные действия (например, выставление счетов-фактур), так и административные (например, управление правами доступа). В разделе описывается способ предоставления таких прав доступа с помощью API и требования к правам доступа со стороны предоставляющего.

POST [/permissions/persons/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1persons~1grants/post)


| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор субъекта или физического лица. `"Nip"`, `"Pesel"`, `"Fingerprint"`             |
| `permissions`                               | Права доступа для предоставления. `"CredentialsManage"`, `"CredentialsRead"`, `"InvoiceWrite"`, `"InvoiceRead"`, `"Introspection"`, `"SubunitManage"`, `"EnforcementOperations"`		   |
| `description`                              | Текстовое значение (описание)              |
 

Список прав доступа, которые могут быть предоставлены физическому лицу:


| Право доступа | Описание |
| :------------------ | :---------------------------------- |
| `CredentialsManage` | Управление правами доступа |
| `CredentialsRead` | Просмотр прав доступа |
| `InvoiceWrite` | Выставление счетов-фактур |
| `InvoiceRead` | Просмотр счетов-фактур |
| `Introspection` | Просмотр истории сессий |
| `SubunitManage` | Управление подчиненными подразделениями |
| `EnforcementOperations` | Выполнение операций принудительного исполнения |

 


Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\PersonPermission\PersonPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/PersonPermission/PersonPermissionE2ETests.cs)

```csharp
GrantPermissionsPersonRequest request = GrantPersonPermissionsRequestBuilder
    .Create()
    .WithSubject(subject)
    .WithPermissions(
        StandardPermissionType.InvoiceRead,
        StandardPermissionType.InvoiceWrite)
    .WithDescription(description)
    .Build();

OperationResponse response =
    await KsefClient.GrantsPermissionPersonAsync(request, accessToken, CancellationToken);
```

Пример на языке Java:
[PersonPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/PersonPermissionIntegrationTest.java)

```java

GrantPersonPermissionsRequest request = new GrantPersonPermissionsRequestBuilder()
        .withSubjectIdentifier(new PersonPermissionsSubjectIdentifier(PersonPermissionsSubjectIdentifier.IdentifierType.PESEL, personValue))
        .withPermissions(List.of(PersonPermissionType.INVOICEWRITE, PersonPermissionType.INVOICEREAD))
        .withDescription("e2e test grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionPerson(request, accessToken);
```

Права доступа может предоставлять тот, кто является:
- владельцем
- обладает правом доступа `CredentialsManage`
- администратором подчиненных подразделений, который обладает `SubunitManage`
- администратором субъекта ЕС, который обладает `VatUeManage`


---
### Предоставление субъектам прав доступа для обслуживания счетов-фактур

KSeF позволяет предоставлять права доступа субъектам, которые от имени данной организации будут обрабатывать счета-фактуры – например, бухгалтерским фирмам, центрам общих услуг или аутсорсинговым компаниям. Права доступа InvoiceRead и InvoiceWrite могут предоставляться непосредственно и при необходимости – с возможностью дальнейшей передачи (флаг `canDelegate`). В этом разделе рассматривается механизм предоставления этих прав доступа, требуемые роли и примерные реализации.

POST [/permissions/entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1entities~1grants/post)


* **InvoiceWrite (Выставление счетов-фактур)**: Это право доступа позволяет отправлять файлы счетов-фактур в формате XML в систему KSeF. После успешной верификации и присвоения номера KSeF эти файлы становятся структурированными счетами-фактурами.
* **InvoiceRead (Просмотр счетов-фактур)**: Благодаря этому праву доступа субъект может получать списки счетов-фактур в рамках данного контекста, получать содержимое счетов-фактур, счета-фактуры, сообщать о злоупотреблениях, а также генерировать и просматривать идентификаторы совокупных платежей.
* Права доступа **InvoiceWrite** и **InvoiceRead** могут предоставляться непосредственно субъектам уполномочивающим субъектом. Клиент API, который предоставляет эти права доступа непосредственно, должен обладать правом доступа **CredentialsManage** или ролью **Owner**. В случае предоставления прав доступа субъектам возможна установка флага `canDelegate` на `true` для **InvoiceRead** и **InvoiceWrite**, что позволяет дальнейшую косвенную передачу этого права доступа.



| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор субъекта. `"Nip"`               |
| `permissions`                               | Права доступа для предоставления. `"InvoiceWrite"`, `"InvoiceRead"`			   |
| `description`                              | Текстовое значение (описание)              |

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EntityPermission\EntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EntityPermission/EntityPermissionE2ETests.cs)

```csharp
GrantPermissionsEntityRequest request = GrantEntityPermissionsRequestBuilder
    .Create()
    .WithSubject(subject)
    .WithPermissions(
        Permission.New(StandardPermissionType.InvoiceRead, true),
        Permission.New(StandardPermissionType.InvoiceWrite, false)
    )
    .WithDescription(description)
    .Build();

OperationResponse response = await KsefClient.GrantsPermissionEntityAsync(request, accessToken, CancellationToken);
```
Пример на языке Java:
[EntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EntityPermissionIntegrationTest.java)

```java
GrantEntityPermissionsRequest request = new GrantEntityPermissionsRequestBuilder()
        .withPermissions(List.of(
                new EntityPermission(EntityPermissionType.INVOICE_READ, true),
                new EntityPermission(EntityPermissionType.INVOICE_WRITE, false)))
        .withDescription(DESCRIPTION)
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, targetNip))
        .build();

OperationResponse response = ksefClient.grantsPermissionEntity(request, accessToken);
```

---
### Предоставление субъектных прав доступа

Для выбранных процессов выставления счетов-фактур KSeF предусматривает так называемые субъектные права доступа, которые применяются в контексте выставления счетов-фактур от имени другого субъекта (`TaxRepresentative`, `SelfInvoicing`, `RRInvoicing`). Эти права доступа могут предоставляться исключительно владельцем или администратором, обладающим `CredentialsManage`. В разделе представлен способ их предоставления, применение и технические ограничения.

POST [/permissions/authorizations/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1authorizations~1grants/post)

Служит для предоставления так называемых субъектных прав доступа, таких как `SelfInvoicing` (самовыставление счетов-фактур), `RRInvoicing` (самовыставление счетов-фактур RR) или `TaxRepresentative` (операции налогового представителя).

Характер прав доступа:

Это субъектные права доступа, что означает, что они важны при отправке субъектом файлов счетов-фактур и проверяются в процессе их валидации. Проверяется зависимость между субъектом и данными на счетах-фактурах. Могут изменяться во время сессии. 

Требуемые права доступа для предоставления прав доступа: ```CredentialsManage``` или ```Owner```.

| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор субъекта. `"Nip"`               |
| `permissions`                               | Права доступа для предоставления. `"SelfInvoicing"`, `"RRInvoicing"`, `"TaxRepresentative"`			   |
| `description`                              | Текстовое значение (описание)              |


Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\AuthorizationPermission\AuthorizationPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/AuthorizationPermission/AuthorizationPermissionsE2ETests.cs)

```csharp
GrantPermissionsAuthorizationRequest grantPermissionsAuthorizationRequest = GrantAuthorizationPermissionsRequestBuilder
    .Create()
    .WithSubject(new AuthorizationSubjectIdentifier
    {
        Type = AuthorizationSubjectIdentifierType.PeppolId,
        Value = peppolId
    })
    .WithPermission(AuthorizationPermissionType.PefInvoicing)
    .WithDescription($"E2E: Предоставление права доступа на выставление счетов-фактур PEF для фирмы {companyNip} (по запросу {peppolId})")
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsAuthorizationPermissionAsync(grantPermissionAuthorizationRequest,
    accessToken, CancellationToken);
```

Пример на языке Java:
[ProxyPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ProxyPermissionIntegrationTest.java)

```java
GrantAuthorizationPermissionsRequest request = new GrantAuthorizationPermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, subjectNip))
        .withPermission(InvoicePermissionType.SELF_INVOICING)
        .withDescription("e2e test grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionsProxyEntity(request, accessToken);
```
---
### Предоставление прав доступа косвенным образом

Механизм косвенного предоставления прав доступа позволяет действовать так называемому субъекту-посреднику, который – на основе ранее полученных делегаций – может передавать выбранные права доступа дальше, в контексте другого субъекта. Чаще всего это касается бухгалтерских фирм, которые обслуживают многих клиентов. В разделе описаны условия, которые должны быть выполнены для использования этой функциональности, и представлена структура данных, требуемых для выполнения такого предоставления.

Права доступа `InvoiceWrite` и `InvoiceRead` – это единственные права доступа, которые могут предоставляться косвенным образом. Это означает, что субъект-посредник может предоставить эти права доступа другому субъекту (уполномоченному), которые будут действовать в контексте целевого субъекта (партнера). Эти права доступа могут быть селективными (для конкретного партнера) или генеральными (для всех партнеров субъекта-посредника). В случае селективного предоставления в идентификаторе целевого субъекта следует указать тип `"Nip"` и значение конкретного номера nip. В то время как в случае генеральных прав доступа в идентификаторе целевого субъекта следует указать тип `"AllPartners"`, без заполненного поля `value`.

POST [/permissions/indirect/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1indirect~1grants/post)



| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор физического лица. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `targetIdentifier`                        | Идентификатор целевого субъекта. `"Nip"` или `null`              |
| `permissions`                               | Права доступа для предоставления. `"InvoiceRead"`, `"InvoiceWrite"`			   |
| `description`                              | Текстовое значение (описание)              |

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\IndirectPermission\IndirectPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/IndirectPermission/IndirectPermissionE2ETests.cs)

```csharp
GrantPermissionsIndirectEntityRequest request = GrantIndirectEntityPermissionsRequestBuilder
    .Create()
    .WithSubject(subject)
    .WithContext(new TargetIdentifier { Type = TargetIdentifierType.Nip, Value = targetNip })
    .WithPermissions(StandardPermissionType.InvoiceRead, StandardPermissionType.InvoiceWrite)
    .WithDescription(description)
    .Build();

OperationResponse grantOperationResponse = await KsefClient.GrantsPermissionIndirectEntityAsync(request, accessToken, CancellationToken);
```

Пример на языке Java:
[IndirectPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/IndirectPermissionIntegrationTest.java)

```java
GrantIndirectEntityPermissionsRequest request = new GrantIndirectEntityPermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, subjectNip))
        .withTargetIdentifier(new TargetIdentifier(TargetIdentifier.IdentifierType.NIP, targetNip))
        .withPermissions(List.of(INVOICE_WRITE))
        .withDescription("E2E indirect grantE2E indirect grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionIndirectEntity(request, accessToken);

```
---
### Предоставление прав доступа администратора подчиненного субъекта

Организационная структура субъекта может включать подчиненные подразделения или субъектов – например, отделения, отделы, дочерние компании, членов группы НДС, а также подразделения органов местного самоуправления. KSeF позволяет присваивать права доступа на управление такими подразделениями. Требуется обладание правом доступа `SubunitManage`. В этом разделе представлен способ предоставления административных прав доступа в контексте подчиненного подразделения или подчиненного субъекта, с учетом идентификатора `InternalId` или `Nip`.

POST [/permissions/subunits/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1subunits~1grants/post)



Требуемые права доступа для предоставления:

- Пользователь, который хочет предоставить эти права доступа, должен обладать правом доступа ```SubunitManage``` (Управление подчиненными подразделениями). 

| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор физического лица или субъекта. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `contextIdentifier`                        | Идентификатор подчиненного субъекта. `"Nip"`, `InternalId`              |
| `subunitName`                              | Название подчиненного подразделения              |
| `description`                              | Текстовое значение (описание)              |

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\SubunitPermission\SubunitPermissionsE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/SubunitPermission/SubunitPermissionsE2ETests.cs)

```csharp
GrantPermissionsSubunitRequest subunitGrantRequest =
    GrantSubunitPermissionsRequestBuilder
    .Create()
    .WithSubject(_fixture.SubjectIdentifier)
    .WithContext(new SubunitContextIdentifier
    {
        Type = SubunitContextIdentifierType.InternalId,
        Value = Fixture.UnitNipInternal
    })
    .WithSubunitName("E2E Test Subunit")
    .WithDescription("E2E test grant sub-unit")
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsPermissionSubUnitAsync(grantPermissionsSubUnitRequest, accessToken, CancellationToken);
```
Пример на языке Java:

[SubUnitPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/SubUnitPermissionIntegrationTest.java)

```java
SubunitPermissionsGrantRequest request = new SubunitPermissionsGrantRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.NIP, subjectNip))
        .withContextIdentifier(new ContextIdentifier(ContextIdentifier.IdentifierType.INTERNALID, contextNip))
        .withDescription("e2e subunit test")
        .withSubunitName("test")
        .build();

OperationResponse response = ksefClient.grantsPermissionSubUnit(request, accessToken);

```
---
### Предоставление прав доступа администратора субъекта ЕС

Предоставление прав доступа администратора субъекта ЕС в KSeF позволяет уполномочить субъект или лицо, назначенное субъектом ЕС, имеющим право на самовыставление счетов-фактур от имени польского субъекта, предоставляющего полномочия. Выполнение этой операции приводит к тому, что уполномоченное таким образом лицо получает возможность входа в систему в составном контексте: `NipVatUe`, связывающем польский субъект, предоставляющий полномочия, с субъектом ЕС, имеющим право на самовыставление счетов-фактур. После предоставления прав доступа администратора субъекта ЕС такое лицо сможет выполнять операции со счетами-фактурами, а также управлять правами доступа других лиц (так называемых представителей субъекта ЕС) в рамках этого составного контекста.

POST [/permissions/eu-entities/administration/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1eu-entities~1administration~1grants/post)



| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор физического лица или субъекта. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `contextIdentifier`                        | Двухчастный идентификатор, состоящий из номера NIP и номера VAT-UE `{nip}-{vat_ue}`. `"NipVatUe"`              |
| `description`                              | Текстовое значение (описание)              |

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuEntityPermission\EuEntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuEntityPermission/EuEntityPermissionE2ETests.cs)

```csharp
GrantPermissionsEuEntityRequest grantPermissionsEuEntityRequest = GrantEUEntityPermissionsRequestBuilder
    .Create()
    .WithSubject(TestFixture.EuEntity)
    .WithSubjectName(EuEntitySubjectName)
    .WithContext(contextIdentifier)
    .WithDescription(EuEntityDescription)
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsPermissionEUEntityAsync(grantPermissionsRequest, accessToken, CancellationToken);
```
Пример на языке Java:
[EuEntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityPermissionIntegrationTest.java)

```java
EuEntityPermissionsGrantRequest request = new GrantEUEntityPermissionsRequestBuilder()
        .withSubject(new SubjectIdentifier(SubjectIdentifier.IdentifierType.FINGERPRINT, euEntity))
        .withEuEntityName("Sample Subject Name")
        .withContext(new ContextIdentifier(ContextIdentifier.IdentifierType.NIP_VAT_UE, nipVatUe))
        .withDescription("E2E EU Entity Permission Test")
        .build();

OperationResponse response = ksefClient.grantsPermissionEUEntity(request, accessToken);

```
---
### Предоставление прав доступа представителя субъекта ЕС

Представитель субъекта ЕС – это лицо, действующее от имени подразделения, зарегистрированного в ЕС, которому необходим доступ к KSeF для просмотра или выставления счетов-фактур. Такое право доступа может предоставляться исключительно администратором VAT UE. В разделе представлена структура данных и способ вызова соответствующего эндпоинта.

POST [/permissions/eu-entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1eu-entities~1grants/post)



| Поле                                       | Значение                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Идентификатор субъекта. `"Fingerprint"`               |
| `permissions`                               | Права доступа для предоставления. `"InvoiceRead"`, `"InvoiceWrite"`			   |
| `description`                              | Текстовое значение (описание)              |

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuRepresentativePermission\EuRepresentativePermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuRepresentativePermission/EuRepresentativePermissionE2ETests.cs)

```csharp
GrantPermissionsEuEntityRepresentativeRequest grantRepresentativePermissionsRequest = GrantEUEntityRepresentativePermissionsRequestBuilder
    .Create()
    .WithSubject(new Client.Core.Models.Permissions.EUEntityRepresentative.SubjectIdentifier
    {
        Type = Client.Core.Models.Permissions.EUEntityRepresentative.SubjectIdentifierType.Fingerprint,
        Value = euRepresentativeEntityCertificateFingerprint
    })
    .WithPermissions(
        StandardPermissionType.InvoiceWrite,
        StandardPermissionType.InvoiceRead
        )
    .WithDescription("Representative for EU Entity")
    .Build();

OperationResponse grantRepresentativePermissionResponse = await KsefClient.GrantsPermissionEUEntityRepresentativeAsync(grantRepresentativePermissionsRequest,
    euAuthInfo.AccessToken.Token,
    CancellationToken.None);
```
Пример на языке Java:
[EuEntityRepresentativePermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityRepresentativePermissionIntegrationTest.java)

```java
GrantEUEntityRepresentativePermissionsRequest request = new GrantEUEntityRepresentativePermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.FINGERPRINT, fingerprint))
        .withPermissions(List.of(EuEntityPermissionType.INVOICE_WRITE, EuEntityPermissionType.INVOICE_READ))
        .withDescription("Representative for EU Entity")
        .build();

OperationResponse response = ksefClient.grantsPermissionEUEntityRepresentative(request, accessToken);


```

## Отзыв прав доступа

Процесс отзыва прав доступа в KSeF столь же важен, как и их предоставление – обеспечивает контроль доступа и позволяет быстро реагировать в ситуациях, таких как смена роли сотрудника, окончание сотрудничества с внешним партнером или нарушение принципов безопасности. Отзыв прав доступа может выполняться для каждой категории получателей: физического лица, субъекта, подчиненного подразделения, представителя ЕС или администратора ЕС. В этом разделе рассматриваются методы отзыва различных типов прав доступа и требуемые идентификаторы.

### Отзыв прав доступа

Стандартный метод отзыва прав доступа, которым можно воспользоваться в отношении большинства случаев: физических лиц, отечественных субъектов, подчиненных подразделений, а также представителей ЕС или администраторов ЕС. Операция требует знания `permissionId` и обладания соответствующим правом доступа. 

DELETE [/permissions/common/grants/\{permissionId\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Odbieranie-uprawnien/paths/~1permissions~1common~1grants~1%7BpermissionId%7D/delete)

Этот метод служит для отзыва прав доступа таких как:

- предоставленных физическим лицам для работы в KSeF,
- предоставленных субъектам для обслуживания счетов-фактур,
- предоставленных косвенным образом,
- администратора подчиненного субъекта,
- администратора субъекта ЕС,
- представителя субъекта ЕС.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
OperationResponse operationResponse = await KsefClient.RevokeCommonPermissionAsync(permission.Id, accessToken, CancellationToken);
```

Пример на языке Java:
[EntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EntityPermissionIntegrationTest.java)

```java
OperationResponse response = ksefClient.revokeCommonPermission(permissionId, accessToken);
```
---
### Отзыв субъектных прав доступа

В случае прав доступа субъектного типа (`SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`) действует отдельный метод отзыва – с использованием эндпоинта, выделенного для авторизационных операций. Права доступа этого типа не передаются, поэтому их отзыв имеет немедленный эффект и прекращает возможность реализации операций выставления счетов-фактур в данном режиме. Требуется знание `permissionId`.

DELETE [/permissions/authorizations/grants/\{permissionId\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Odbieranie-uprawnien/paths/~1permissions~1authorizations~1grants~1%7BpermissionId%7D/delete)

Этот метод служит для отзыва прав доступа таких как:

- самовыставление счетов-фактур,
- самовыставление счетов-фактур RR,
- операции налогового представителя.

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuEntityPermission\EuEntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuEntityPermission/EuEntityPermissionE2ETests.cs)

```csharp
await ksefClient.RevokeAuthorizationsPermissionAsync(permissionId, accessToken, cancellationToken);
```

Пример на языке Java:
[ProxyPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ProxyPermissionIntegrationTest.java)

```java
OperationResponse response = ksefClient.revokeAuthorizationsPermission(operationId, accessToken);
```


## Поиск предоставленных прав доступа

KSeF предоставляет набор эндпоинтов, позволяющих запрашивать список активных прав доступа, предоставленных пользователям и субъектам. Эти механизмы необходимы для аудита, просмотра состояния доступа, а также при создании административных интерфейсов (например, для управления структурой доступа в организации). Раздел содержит обзор методов поиска с разделением по категориям предоставленных прав доступа.

---
### Получение списка собственных прав доступа

Запрос позволяет получить список прав доступа, которыми обладает аутентифицированный субъект.
 В этом списке находятся права доступа:
- предоставленные непосредственно в текущем контексте
- предоставленные вышестоящим субъектом
- предоставленные косвенным образом, где контекстом является посредник или целевой субъект
- предоставленные субъекту для обслуживания счетов-фактур (`"InvoiceRead"` и `"InvoiceWrite"`) другим субъектом, если аутентифицированный субъект имеет владельческие права доступа (`"Owner"`) 

POST [/permissions/query/personal/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1personal~1grants/post)

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\Permissions\PersonPermission\PersonalPermissions_AuthorizedPesel_InNipContext_E2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/PersonPermission/PersonalPermissions_AuthorizedPesel_InNipContext_E2ETests.cs)
```csharp
PersonalPermissionsQueryRequest query = new PersonalPermissionsQueryRequest
{
    ContextIdentifier = /*...*/,
    TargetIdentifier = /*...*/,
    PermissionTypes = /*...*/,
    PermissionState = /*...*/
};

PagedPermissionsResponse<PersonalPermission> searchedGrantedPersonalPermissions = 
    await KsefClient.SearchGrantedPersonalPermissionsAsync(query, entityAuthorizationInfo.AccessToken.Token);
```
