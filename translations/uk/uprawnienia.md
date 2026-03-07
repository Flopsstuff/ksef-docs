---
original: uprawnienia.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [uprawnienia.md](https://github.com/CIRFMF/ksef-docs/blob/main/uprawnienia.md)

## Дозволи
10.07.2025

### Вступ – бізнес-контекст
Система KSeF впроваджує розширений механізм управління дозволами, який є основою безпечного та відповідного до законодавства використання системи різними суб'єктами. Дозволи визначають, хто може виконувати певні операції в KSeF – такі як виставлення рахунків, перегляд документів, надання подальших дозволів чи управління підпорядкованими підрозділами.

### Цілі управління дозволами:
- Безпека даних – обмеження доступу до інформації лише для осіб та суб'єктів, які мають на це формальні права.
- Відповідність законодавству – забезпечення того, щоб операції виконувались належними підрозділами згідно з законодавчими вимогами (наприклад, Закон про ПДВ).
- Можливість аудиту – кожна операція, пов'язана з наданням або відкликанням дозволів, реєструється і може бути піддана аналізу.

### Хто надає дозволи?
Дозволи можуть надаватись:

- власником суб'єкта - роль (Owner),
- адміністратором підпорядкованого суб'єкта,
- адміністратором підпорядкованого підрозділу,
- адміністратором союзного суб'єкта,
- адміністратором суб'єкта, тобто іншим суб'єктом або особою, що має дозвіл CredentialsManage.

На практиці це означає, що кожна організація повинна управляти дозволами своїх працівників, наприклад, надавати дозволи працівнику бухгалтерського відділу при прийнятті нового працівника або відкликати дозволи, коли такий працівник припиняє трудові відносини.

### Коли надаються дозволи?
#### Приклади:
- при початку співпраці з новим працівником,
- у випадку, коли компанія вступає в співпрацю, наприклад, з бухгалтерським бюро, вона повинна надати дозволи на читання рахунків цьому бухгалтерському бюро, щоб воно могло обробляти рахунки цієї компанії,
- у зв'язку зі змінами відносин між суб'єктами.

### Структура наданих дозволів:
Дозволи надаються:
1) Фізичним особам, ідентифікованим за PESEL, NIP або відбитком пальця сертифіката – для роботи в KSeF:
    - в контексті суб'єкта, що надає дозвіл (дозволи, надані безпосередньо) або
    - в контексті іншого суб'єкта або інших суб'єктів:
        - в контексті підпорядкованого суб'єкта, ідентифікованого за NIP (підпорядкованої одиниці місцевого самоврядування або члена групи ПДВ),
        - в контексті підпорядкованого підрозділу, ідентифікованого внутрішнім ідентифікатором,
        - в складеному контексті NIP-ПДВ ЄС, що поєднує польський суб'єкт із союзним суб'єктом, уповноваженим на самофактурування від імені цього польського суб'єкта,
        - в контексті вказаного суб'єкта, ідентифікованого за NIP – клієнта суб'єкта, що надає дозволи (селективні дозволи, надані опосередковано),
        - в контексті всіх суб'єктів – клієнтів суб'єкта, що надає дозволи (загальні дозволи, надані опосередковано).
2) Іншим суб'єктам – ідентифікованим за NIP:
    - як кінцевим отримувачам дозволів на виставлення або перегляд рахунків,
    - як посередникам - з увімкненою опцією дозволу на подальше передавання дозволів, щоб уповноважений суб'єкт мав можливість надавати дозволи опосередковано (див. п. IV і V вище).

3) Іншим суб'єктам для діяльності в своєму контексті від імені уповноважуючого суб'єкта (дозволи суб'єктів):
    - податковим представникам,
    - суб'єктам, уповноваженим на самофактурування,
    - суб'єктам, уповноваженим на виставлення рахунків ПДВ RR.

Доступ до функцій системи залежить від контексту, в якому відбулась аутентифікація, та від обсягу дозволів, наданих аутентифікованому суб'єкту/особі в цьому контексті.

##  Словник понять (в частині дозволів KSeF)

| Термін                          | Визначення |
|---------------------------------|-----------|
| **Дозвіл**                 | Дозвіл на виконання певних операцій в KSeF, наприклад, `InvoiceWrite`, `CredentialsManage`. |
| **Власник**                       | Власник суб'єкта – особа, що має за замовчуванням повний доступ до операцій в контексті суб'єкта з таким самим ідентифікатором NIP, який записано в використаному засобі аутентифікації; для власника також діє зв'язування NIP-PESEL, тому він може аутентифікуватись також засобом, що містить пов'язаний номер PESEL, зберігаючи всі права власника. |
| **Адміністратор підпорядкованого суб'єкта**              | Особа з дозволами на управління дозволами (`CredentialsManage`) в контексті підпорядкованого суб'єкта. Може надавати дозволи (наприклад, `InvoiceWrite`). Підпорядкованим суб'єктом може бути, наприклад, член групи ПДВ. |
| **Адміністратор підпорядкованого підрозділу**              | Особа з дозволами на управління дозволами (`CredentialsManage`) в підпорядкованому підрозділі. Може надавати дозволи (наприклад, `InvoiceWrite`). |
| **Адміністратор союзного суб'єкта**              | Особа з дозволами на управління дозволами (`CredentialsManage`) в складеному контексті, ідентифікованому за допомогою NipVatUe. Може надавати дозволи (наприклад, `InvoiceRead`). |
| **Посередницький суб'єкт**   | Суб'єкт, який отримав дозвіл з флагом `canDelegate = true` і може передати цей дозвіл далі, тобто надати дозвіл опосередковано. Це можуть бути лише дозволи `InvoiceWrite` і `InvoiceRead`. |
| **Цільовий суб'єкт**  | Суб'єкт, в контексті якого діє даний дозвіл – наприклад, компанія, обслуговувана бухгалтерським бюро. |
| **Надано безпосередньо**       | Дозвіл, наданий прямо даному користувачу або суб'єкту власником або адміністратором. |
| **Надання опосередковано**          | Дозвіл, наданий посередником для обслуговування іншого суб'єкта – лише для `InvoiceRead` і `InvoiceWrite`. |
| **`canDelegate`**              | Технічний флаг (`true` / `false`), що дозволяє делегування дозволів. Лише `InvoiceRead` та `InvoiceWrite` можуть мати `canDelegate = true`. Може використовуватись лише при наданні дозволу суб'єкту для обслуговування рахунків |
| **`subjectIdentifier`**        | Дані, що ідентифікують отримувача дозволів (особу або суб'єкт): `Nip`, `Pesel`, `Fingerprint`. |
| **`targetIdentifier` / `contextIdentifier`** | Дані, що ідентифікують контекст, в якому діє наданий дозвіл – наприклад, NIP клієнта, внутрішній ідентифікатор організаційної одиниці. |
| **Fingerprint**                | Результат обчислення хеш-функції SHA-256 на кваліфікованому сертифікаті. Дозволяє розпізнавати сертифікат суб'єкта, що має дозвіл, наданий на відбиток пальця сертифіката. Використовується, зокрема, при ідентифікації осіб або іноземних суб'єктів. |
| **InternalId**                 | Внутрішній ідентифікатор підпорядкованого підрозділу в системі KSeF - двочленний ідентифікатор, що складається з номера NIP та п'яти цифр `nip-5_цифр`.  |
| **NipVatUe**                   | Складений ідентифікатор, тобто двочленний ідентифікатор, що складається з номера NIP польського суб'єкта та номера ПДВ ЄС союзного суб'єкта, які розділені за допомогою сепаратора `nip-пдв_єс`. |
| **Відкликання**                     | Операція відкликання раніше наданого дозволу. |
| **`permissionId`**             | Технічний ідентифікатор наданого дозволу – потрібен, зокрема, при операціях відкликання. |
| **`operationReferenceNumber`** | Ідентифікатор операції (наприклад, надання або відкликання дозволів), що повертається API, використовується для перевірки статусу. |
| **Статус операції**            | Поточний стан процесу надання/відкликання дозволів: `100`, `200`, `400` тощо. |

## Модель ролей і дозволів (матриця дозволів)

Система KSeF дозволяє призначати дозволи точно, з урахуванням типів дій, виконуваних користувачами. Дозволи можуть надаватись як безпосередньо, так і опосередковано – залежно від механізму делегування доступу.

### Приклади ролей для відображення за допомогою дозволів:

| Роль / суб'єкт                          | Опис ролі                                                                                          | Можливі дозволи                                                                 |
|----------------------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| **Власник суб'єкта**      | Роль, яку має автоматично власник. Щоб бути розпізнаним системою як власник, потрібно аутентифікуватись вектором з таким самим ідентифікатором NIP, як NIP контексту входу, або пов'язаним номером PESEL           | Роль `Owner`, що включає всі дозволи з рахунків та адміністративні, крім `VatUeManage`. |
| **Адміністратор суб'єкта**            | Фізична особа, що має права на надання та відкликання дозволів іншим користувачам та/або призначення адміністраторів підпорядкованих підрозділів/суб'єктів.           | `CredentialsManage`, `SubunitManage`, `Introspection`.                              |
| **Оператор (бухгалтерія / рахунки)** | Особа, відповідальна за виставлення або перегляд рахунків.                                        | `InvoiceWrite`, `InvoiceRead`.                                                      |
| **Уповноважений суб'єкт**                | Інший господарський суб'єкт, якому надано певні дозволи на виставлення рахунків від імені суб'єкта, наприклад, податковий представник.             | `SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`                             |
| **Посередницький суб'єкт**              | Суб'єкт, який отримав дозволи з опцією делегування (`canDelegate`) і може надати їх далі.       | `InvoiceRead`, `InvoiceWrite` з флагом `canDelegate = true`.   
| **Адміністратор союзного суб'єкта**     | Особа, що ідентифікується сертифікатом, має права на надання та відкликання дозволів іншим користувачам в рамках союзного суб'єкта, пов'язаного з даним польським суб'єктом.                                     | `InvoiceWrite`, `InvoiceRead`,                                    `VatUeManage`,  `Introspection`.                      |                      |
| **Представник союзного суб'єкта**     | Особа, що ідентифікується сертифікатом, діє на користь союзного суб'єкта, пов'язаного з даним польським суб'єктом.                                     | `InvoiceWrite`, `InvoiceRead`.                                                      |
| **Адміністратор підпорядкованого підрозділу** | Користувач, що має можливість призначати адміністраторів в підпорядкованих підрозділах або суб'єктах.               | `CredentialsManage`.                                                                    |

---

### Класифікація дозволів за типом:

| Тип дозволу           | Приклади значень                                       | Можливість надання опосередковано | Операційний опис                                                              |
|--------------------------|------------------------------------------------------------|-------------------------------|------------------------------------------------------------------------------|
| **Рахункові**             | `InvoiceWrite`, `InvoiceRead`                              | ✔️ (якщо `canDelegate=true`) | Операції з рахунками: надсилання, отримання                     |
| **Адміністративні**       | `CredentialsManage`, `SubunitManage`,  `VatUeManage`.                       | ❌                            | Управління дозволами, підпорядкованими підрозділами                      |
| **Суб'єктів**        | `SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`        | ❌                            | Уповноваження інших суб'єктів на діяльність (виставлення рахунків) у власному контексті від імені уповноважуючого суб'єкта         |
| **Технічні**            | `Introspection`                                            | ❌                            | Доступ до історії операцій та сесій                                         |

---

## Дозволи загальні та селективні

Система KSeF дозволяє надавати вибрані дозволи **загальним (генеральним)** або **селективним (індивідуальним)** способом, що дозволяє гнучко управляти доступом до даних багатьох бізнес-партнерів.

###  Селективні (індивідуальні) дозволи

Селективні дозволи – це такі, що надаються посередницьким суб'єктом (наприклад, бухгалтерським бюро) щодо **конкретного цільового суб'єкта (партнера)**. Дозволяють обмежити обсяг доступу лише до обраного клієнта або організаційної одиниці.

**Приклад:**  
Бухгалтерське бюро XYZ отримало від компанії ABC дозвіл `InvoiceRead` з флагом `canDelegate = true`. Тепер воно може передати цей дозвіл своєму працівнику, але лише в контексті компанії ABC – інші компанії, обслуговувані XYZ, не охоплюються цим доступом.

**Особливості селективності:**
- Необхідно вказати `targetIdentifier` (наприклад, `Nip` партнера).
- Отримувач дозволу діє лише в контексті вказаного суб'єкта.
- Не дає доступу до даних інших партнерів посередницького суб'єкта.

---

###  Загальні (генеральні) дозволи

Загальні дозволи – це такі, що надаються без вказівки конкретного партнера, що означає, що отримувач отримує доступ до операцій в контексті **всіх суб'єктів, дані яких обробляє посередницький суб'єкт**.

**Приклад:**
Суб'єкт A має дозвіл `InvoiceRead` з `canDelegate = true` для багатьох клієнтів. Передає працівнику B загальний дозвіл `InvoiceRead` – B тепер може діяти від імені кожного з клієнтів A (наприклад, переглядати рахунки всіх контрагентів).

**Особливості загальності:**
- Тип ідентифікатора цільового суб'єкта `targetIdentifier` – `AllPartners`.
- Доступ охоплює всі суб'єкти, обслуговувані посередником.
- Застосовується у випадку масової інтеграції, великих центрів спільних послуг або бухгалтерських систем.

---

### Технічні зауваження та обмеження

- Механізм стосується лише дозволів `InvoiceRead` і `InvoiceWrite`, наданих опосередковано.
- На практиці різниця полягає в наявності (селективні) або відсутності (загальні) суб'єкта `targetIdentifier` в тілі запиту `POST /permissions/indirect/grants`.
- Система не дозволяє поєднати в одному виклику надання загального та селективного – потрібно виконувати окремі операції.
- Загальні дозволи слід застосовувати обережно, особливо в продуктивних середовищах, через їх широкий обсяг.

---

### Структура призначення дозволів:

1. **Безпосереднє надання** – наприклад, адміністратор суб'єкта A призначає користувачу дозвіл `InvoiceWrite` фізичній особі в контексті суб'єкта A.
2. **Надання з можливістю подальшого передавання** – наприклад, адміністратор суб'єкта A надає суб'єкту B (посереднику) дозвіл `InvoiceRead` з `canDelegate=true`, що дозволяє адміністратору суб'єкта B надати `InvoiceRead` суб'єкту/особі C.
3. **Надання опосередковано** – з використанням спеціального endpoint /permissions/indirect/grants, де адміністратор посередницького суб'єкта B, який отримав від суб'єкта A дозвіл з делегуванням, надає дозволи від імені для обслуговування цільового суб'єкта A суб'єкту/особі C.

---

### Приклад матриці дозволів:

| Користувач / Суб'єкт       | InvoiceWrite | InvoiceRead | CredentialsManage | SubunitManage | TaxRepresentative |
|----------------------------|--------------|-------------|--------------------|----------------|--------------------|
| Анна Ковальська (PESEL)      | ✅           | ✅          | ❌                 | ❌             | ❌                 |
| Бухгалтерське бюро XYZ (NIP) | ✅ (з делегуванням)          | ✅ (з делегуванням) | ❌                 | ❌             | ❌                 |
| Іван Новак (Ідентифікується сертифікатом)   | ✅           | ✅          | ❌                 | ❌             | ❌                 |
| Адмін бухгалтерського відділу (PESEL)           | ❌           | ❌          | ✅                 | ✅             | ❌                 |
| Материнська компанія тобто owner (NIP)         | ✅           | ✅          | ✅                 | ✅             | ✅                 |
| Адмін групи ПДВ (PESEL)          | ❌           | ❌          | ❌                 | ✅             | ❌                 |
| Податковий представник (NIP)          | ❌           | ❌          | ❌                 | ❌             | ✅                 |

---

### Ролі або дозволи, потрібні для надання дозволів 

| Надання дозволів:                        | Потрібна роль або дозвіл                      |
|-------------------------------------------|---------------------------------------------------|
| фізичній особі для роботи в KSeF      | `Owner` або `CredentialsManage`                   |
| суб'єкту для обслуговування рахунків           | `Owner` або `CredentialsManage`                   |
| суб'єктів | `Owner` або `CredentialsManage`                   |
| для обслуговування рахунків  – опосередковано              | `Owner` або `CredentialsManage`    |
| адміністратору підпорядкованого підрозділу   | `SubunitManage`                                   |
| адміністратору союзного суб'єкта      | `Owner` або `CredentialsManage`    |
| представнику союзного суб'єкта     | `VatUeManage`    |
---

### Обмеження ідентифікаторів (`subjectIdentifier`, `contextIdentifier`)

| Тип ідентифікатора | Ідентифікований | Зауваження |
|--------------------|---------------------|-------|
| `Nip`              | Внутрішній суб'єкт     | Для суб'єктів, зареєстрованих в Польщі, та фізичних осіб |
| `Pesel`            | Фізична особа       | Потрібно, зокрема, при наданні дозволів працівникам, які користуються довіреним профілем або кваліфікованим сертифікатом з номером PESEL  |
| `Fingerprint`      | Власник сертифіката      | Використовується в ситуації, коли кваліфікований сертифікат не містить ідентифікатора NIP або PESEL, а також при ідентифікації адміністраторів або представників союзних суб'єктів   |
| `NipVatUe`         | Союзні суб'єкти, пов'язані з польськими суб'єктами       | Потрібно при наданні дозволів адміністраторам та представникам союзних суб'єктів |
| `InternalId`       | Підпорядковані підрозділи  | Використовується в суб'єктах зі складною структурою підпорядкованих підрозділів |

---

### Функціональні обмеження API

- Неможливо надати той самий дозвіл двічі – API може повернути помилку або проігнорувати дублікат.
- Виконання операції надання дозволу не має миттєвого доступу – операція асинхронна і повинна бути правильно оброблена системою (потрібно перевірити статус операції).

---

### Часові обмеження

- Наданий дозвіл залишається активним до моменту його відкликання.
- Впровадження часового обмеження вимагає логіки з боку клієнтської системи (наприклад, розклад відкликання дозволу).


## Надання дозволів


### Надання дозволів фізичним особам для роботи в KSeF.

В рамках організацій, що користуються KSeF, можливе надання дозволів конкретним фізичним особам – наприклад, працівникам бухгалтерського або ІТ відділу. Дозволи призначаються особі на основі її ідентифікатора (PESEL, NIP або Fingerprint). Дозволи можуть включати як операційні дії (наприклад, виставлення рахунків), так і адміністративні (наприклад, управління дозволами). Секція описує спосіб надання таких дозволів за допомогою API та вимоги щодо дозволів з боку того, хто надає.

POST [/permissions/persons/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1persons~1grants/post)


| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор суб'єкта або фізичної особи. `"Nip"`, `"Pesel"`, `"Fingerprint"`             |
| `permissions`                               | Дозволи для надання. `"CredentialsManage"`, `"CredentialsRead"`, `"InvoiceWrite"`, `"InvoiceRead"`, `"Introspection"`, `"SubunitManage"`, `"EnforcementOperations"`		   |
| `description`                              | Текстове значення (опис)              |
 

Список дозволів, які можуть бути надані фізичній особі:


| Дозвіл | Опис |
| :------------------ | :---------------------------------- |
| `CredentialsManage` | Управління дозволами |
| `CredentialsRead` | Перегляд дозволів |
| `InvoiceWrite` | Виставлення рахунків |
| `InvoiceRead` | Перегляд рахунків |
| `Introspection` | Перегляд історії сесій |
| `SubunitManage` | Управління підпорядкованими підрозділами |
| `EnforcementOperations` | Виконання операцій стягнення |

 


Приклад мовою C#:
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

Приклад мовою Java:
[PersonPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/PersonPermissionIntegrationTest.java)

```java

GrantPersonPermissionsRequest request = new GrantPersonPermissionsRequestBuilder()
        .withSubjectIdentifier(new PersonPermissionsSubjectIdentifier(PersonPermissionsSubjectIdentifier.IdentifierType.PESEL, personValue))
        .withPermissions(List.of(PersonPermissionType.INVOICEWRITE, PersonPermissionType.INVOICEREAD))
        .withDescription("e2e test grant")
        .build();

OperationResponse response = ksefClient.grantsPermissionPerson(request, accessToken);
```

Дозволи може надавати той, хто є:
- власником
- має дозвіл `CredentialsManage`
- адміністратором підпорядкованих підрозділів, який має `SubunitManage`
- адміністратором союзного суб'єкта, який має `VatUeManage`


---
### Надання суб'єктам дозволів для обслуговування рахунків

KSeF дозволяє надавати дозволи суб'єктам, які від імені даної організації будуть обробляти рахунки – наприклад, бухгалтерським бюро, центрам спільних послуг чи аутсорсинговим компаніям. Дозволи InvoiceRead і InvoiceWrite можуть надаватись безпосередньо і за потреби – з можливістю подальшого передавання (флаг `canDelegate`). В цій секції розглянуто механізм надання цих дозволів, потрібні ролі та приклади реалізацій.

POST [/permissions/entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1entities~1grants/post)


* **InvoiceWrite (Виставлення рахунків)**: Цей дозвіл дозволяє надсилати файли рахунків у форматі XML до системи KSeF. Після успішної перевірки та присвоєння номера KSeF ці файли стають структурованими рахунками.
* **InvoiceRead (Перегляд рахунків)**: Завдяки цьому дозволу суб'єкт може отримувати списки рахунків в рамках даного контексту, отримувати зміст рахунків, рахунки, повідомляти про зловживання, а також генерувати та переглядати ідентифікатори збірних платежів.
* Дозволи **InvoiceWrite** та **InvoiceRead** можуть надаватись безпосередньо суб'єктам суб'єктом, що уповноважує. Клієнт API, який надає ці дозволи безпосередньо, повинен мати дозвіл **CredentialsManage** або роль **Owner**. У випадку надання дозволів суб'єктам можливе встановлення флага `canDelegate` на `true` для **InvoiceRead** та **InvoiceWrite**, що дозволяє подальше, опосередковане передавання цього дозволу.



| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор суб'єкта. `"Nip"`               |
| `permissions`                               | Дозволи для надання. `"InvoiceWrite"`, `"InvoiceRead"`			   |
| `description`                              | Текстове значення (опис)              |

Приклад мовою C#:
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
Приклад мовою Java:
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
### Надання дозволів суб'єктів

Для вибраних процесів виставлення рахунків KSeF передбачає т.зв. дозволи суб'єктів, які застосовуються в контексті виставлення рахунків від імені іншого суб'єкта (`TaxRepresentative`, `SelfInvoicing`, `RRInvoicing`). Ці дозволи можуть надаватись виключно власником або адміністратором, що має `CredentialsManage`. Секція представляє спосіб їх надання, застосування та технічні обмеження.

POST [/permissions/authorizations/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1authorizations~1grants/post)

Слугує для надання т.зв. дозволів суб'єктів, таких як `SelfInvoicing` (самофактурування), `RRInvoicing` (самофактурування RR) чи `TaxRepresentative` (операції податкового представника).

Характер дозволів:

Це дозволи суб'єктів, що означає, що вони важливі при надсиланні суб'єктом файлів рахунків і перевіряються в процесі їх валідації. Перевіряється залежність між суб'єктом та даними на рахунках. Можуть змінюватись під час сесії. 

Потрібні дозволи для надання дозволів: ```CredentialsManage``` або ```Owner```.

| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор суб'єкта. `"Nip"`               |
| `permissions`                               | Дозволи для надання. `"SelfInvoicing"`, `"RRInvoicing"`, `"TaxRepresentative"`			   |
| `description`                              | Текстове значення (опис)              |


Приклад мовою C#:
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
    .WithDescription($"E2E: Надання дозволу на виставлення рахунків PEF для компанії {companyNip} (на запит {peppolId})")
    .Build();

OperationResponse operationResponse = await KsefClient
    .GrantsAuthorizationPermissionAsync(grantPermissionAuthorizationRequest,
    accessToken, CancellationToken);
```

Приклад мовою Java:
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
### Надання дозволів опосередковано

Механізм опосередкованого надання дозволів дозволяє діяльність т.зв. посередницького суб'єкта, який – на основі раніше отриманих делегацій – може передавати вибрані дозволи далі, в контексті іншого суб'єкта. Найчастіше це стосується бухгалтерських бюро, які обслуговують багатьох клієнтів. В секції описано умови, які повинні бути виконані, щоб скористатись цією функціональністю, та представлено структуру даних, потрібних для виконання такого надання.

Дозволи `InvoiceWrite` і `InvoiceRead` – це єдині дозволи, які можуть надаватись опосередковано. Це означає, що посередницький суб'єкт може надати ці дозволи іншому суб'єкту (уповноваженому), які будуть діяти в контексті цільового суб'єкта (партнера). Ці дозволи можуть бути селективними (для конкретного партнера) або загальними (для всіх партнерів посередницького суб'єкта). У випадку селективного надання в ідентифікаторі цільового суб'єкта потрібно вказати тип `"Nip"` і значення конкретного номера nip. Натомість у випадку загальних дозволів в ідентифікаторі цільового суб'єкта потрібно вказати тип `"AllPartners"`, без заповненого поля `value`.

POST [/permissions/indirect/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1indirect~1grants/post)



| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор фізичної особи. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `targetIdentifier`                        | Ідентифікатор цільового суб'єкта. `"Nip"` або `null`              |
| `permissions`                               | Дозволи для надання. `"InvoiceRead"`, `"InvoiceWrite"`			   |
| `description`                              | Текстове значення (опис)              |

Приклад мовою C#:
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

Приклад мовою Java:
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
### Надання дозволів адміністратору підпорядкованого суб'єкта

Організаційна структура суб'єкта може включати підпорядковані підрозділи або суб'єкти – наприклад, відділення, департаменти, дочірні компанії, членів групи ПДВ та одиниці місцевого самоврядування. KSeF дозволяє призначити дозволи для управління такими підрозділами. Потрібно мати дозвіл `SubunitManage`. В цій секції представлено спосіб надання адміністративних дозволів в контексті підпорядкованого підрозділу або суб'єкта, з урахуванням ідентифікатора `InternalId` або `Nip`.

POST [/permissions/subunits/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1subunits~1grants/post)



Потрібні дозволи для надання:

- Користувач, який хоче надати ці дозволи, повинен мати дозвіл ```SubunitManage``` (Управління підпорядкованими підрозділами). 

| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор фізичної особи або суб'єкта. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `contextIdentifier`                        | Ідентифікатор підпорядкованого суб'єкта. `"Nip"`, `InternalId`              |
| `subunitName`                              | Назва підпорядкованого підрозділу              |
| `description`                              | Текстове значення (опис)              |

Приклад мовою C#:
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
Приклад мовою Java:

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
### Надання дозволів адміністратору союзного суб'єкта

Надання дозволів адміністратору союзного суб'єкта в KSeF дозволяє уповноважити суб'єкт або особу, призначену союзним суб'єктом, що має право на самофактурування від імені польського суб'єкта, який надає дозвіл. Виконання цієї операції призводить до того, що уповноважена таким чином особа отримує можливість входу в систему в складеному контексті: `NipVatUe`, що поєднує польський суб'єкт, який надає дозвіл, з союзним суб'єктом, що має право на самофактурування. Після надання дозволів адміністратору союзного суб'єкта така особа зможе виконувати операції з рахунками, а також управляти дозволами інших осіб (т.зв. представників союзного суб'єкта) в рамках цього складеного контексту.

POST [/permissions/eu-entities/administration/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1eu-entities~1administration~1grants/post)



| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор фізичної особи або суб'єкта. `"Nip"`, `"Pesel"`, `"Fingerprint"`               |
| `contextIdentifier`                        | Двочленний ідентифікатор, що складається з номера NIP і номера ПДВ-ЄС `{nip}-{пдв_єс}`. `"NipVatUe"`              |
| `description`                              | Текстове значення (опис)              |

Приклад мовою C#:
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
Приклад мовою Java:
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
### Надання дозволів представнику союзного суб'єкта

Представник союзного суб'єкта – це особа, що діє на користь підрозділу, зареєстрованого в ЄС, якому потрібен доступ до KSeF для перегляду або виставлення рахунків. Такий дозвіл може надаватись виключно адміністратором ПДВ ЄС. Секція представляє структуру даних та спосіб виклику відповідного endpoint.

POST [/permissions/eu-entities/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Nadawanie-uprawnien/paths/~1permissions~1eu-entities~1grants/post)



| Поле                                       | Значення                                         |
| :----------------------------------------- | :---------------------------------------------- |
| `subjectIdentifier`                        | Ідентифікатор суб'єкта. `"Fingerprint"`               |
| `permissions`                               | Дозволи для надання. `"InvoiceRead"`, `"InvoiceWrite"`			   |
| `description`                              | Текстове значення (опис)              |

Приклад мовою C#:
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
Приклад мовою Java:
[EuEntityRepresentativePermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EuEntityRepresentativePermissionIntegrationTest.java)

```java
GrantEUEntityRepresentativePermissionsRequest request = new GrantEUEntityRepresentativePermissionsRequestBuilder()
        .withSubjectIdentifier(new SubjectIdentifier(SubjectIdentifier.IdentifierType.FINGERPRINT, fingerprint))
        .withPermissions(List.of(EuEntityPermissionType.INVOICE_WRITE, EuEntityPermissionType.INVOICE_READ))
        .withDescription("Representative for EU Entity")
        .build();

OperationResponse response = ksefClient.grantsPermissionEUEntityRepresentative(request, accessToken);


```

## Відкликання дозволів

Процес відкликання дозволів у KSeF є так само важливим, як і їх надання – забезпечує контроль доступу та дозволяє швидко реагувати в ситуаціях, таких як зміна ролі працівника, закінчення співпраці з зовнішнім партнером або порушення правил безпеки. Відкликання дозволів може виконуватись для кожної категорії отримувачів: фізичної особи, суб'єкта, підпорядкованого підрозділу, представника ЄС або адміністратора ЄС. В цій секції розглянуто методи відкликання різних типів дозволів та потрібні ідентифікатори.

### Відкликання дозволів

Стандартний метод відкликання дозволів, яким можна скористатись щодо більшості випадків: фізичних осіб, внутрішніх суб'єктів, підпорядкованих підрозділів, а також представників ЄС або адміністраторів ЄС. Операція вимагає знання `permissionId` та наявності відповідного дозволу. 

DELETE [/permissions/common/grants/\{permissionId\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Odbieranie-uprawnien/paths/~1permissions~1common~1grants~1%7BpermissionId%7D/delete)

Цей метод слугує для відкликання дозволів таких як:

- наданих фізичним особам для роботи в KSeF,
- наданих суб'єктам для обслуговування рахунків,
- наданих опосередковано,
- адміністратора підпорядкованого суб'єкта,
- адміністратора союзного суб'єкта,
- представника союзного суб'єкта.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Certificates\CertificatesE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Certificates/CertificatesE2ETests.cs)
```csharp
OperationResponse operationResponse = await KsefClient.RevokeCommonPermissionAsync(permission.Id, accessToken, CancellationToken);
```

Приклад мовою Java:
[EntityPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/EntityPermissionIntegrationTest.java)

```java
OperationResponse response = ksefClient.revokeCommonPermission(permissionId, accessToken);
```
---
### Відкликання дозволів суб'єктів

У випадку дозволів типу суб'єктів (`SelfInvoicing`, `RRInvoicing`, `TaxRepresentative`) діє окремий метод відкликання – з використанням endpoint, призначеного для авторизаційних операцій. Дозволи такого типу не передаються, тому їх відкликання має миттєвий ефект і завершує можливість реалізації операцій з рахунками в даному режимі. Потрібно знати `permissionId`.

DELETE [/permissions/authorizations/grants/\{permissionId\}](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Odbieranie-uprawnien/paths/~1permissions~1authorizations~1grants~1%7BpermissionId%7D/delete)

Цей метод слугує для відкликання дозволів таких як:

- самофактурування,
- самофактурування RR,
- операції податкового представника.

Приклад мовою C#:
[KSeF.Client.Tests.Core\E2E\Permissions\EuEntityPermission\EuEntityPermissionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/Permissions/EuEntityPermission/EuEntityPermissionE2ETests.cs)

```csharp
await ksefClient.RevokeAuthorizationsPermissionAsync(permissionId, accessToken, cancellationToken);
```

Приклад мовою Java:
[ProxyPermissionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/ProxyPermissionIntegrationTest.java)

```java
OperationResponse response = ksefClient.revokeAuthorizationsPermission(operationId, accessToken);
```


## Пошук наданих дозволів

KSeF надає набір endpoints, що дозволяють запитувати список активних дозволів, наданих користувачам і суб'єктам. Ці механізми необхідні для аудиту, перегляду стану доступу, а також при створенні адміністративних інтерфейсів (наприклад, для управління структурою доступу в організації). Секція містить огляд методів пошуку з розподілом за категоріями наданих дозволів.

---
### Отримання списку власних дозволів

Запит дозволяє отримати список дозволів, якими володіє аутентифікований суб'єкт.
 У цьому списку знаходяться дозволи:
- надані безпосередньо в поточному контексті
- надані вищестоящим суб'єктом
- надані опосередковано, де контекстом є посередник або цільовий суб'єкт
- надані суб'єкту для обслуговування рахунків (`"InvoiceRead"` і `"InvoiceWrite"`) іншим суб'єктом, якщо аутентифікований суб'єкт має дозволи власника (`"Owner"`) 

POST [/permissions/query/personal/grants](https://api-test.ksef.mf.gov.pl/docs/v2/index.html#tag/Wyszukiwanie-nadanych-uprawnien/paths/~1permissions~1query~1personal~1grants/post)

При
