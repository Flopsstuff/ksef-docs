---
original: api-changelog.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 935d16c
last_translated: 2026-03-07
---

> **Translation.** Original: [api-changelog.md](https://github.com/CIRFMF/ksef-docs/blob/main/api-changelog.md)

## Зміни в API 2.0

### Версія 2.2.1

- **Надсилання рахунків-фактур**  
  Додано нову версію (`1-1E`) схеми `FA_RR (1)`.  
  Схема `FA_RR (1) 1-0E` буде підтримуватися на середовищі TEST до 23.04.
  Схема `FA_RR (1) 1-1E` буде обов'язковою на середовищі PRD з 01.04.  

### Версія 2.2.0

- **Дозволи**  
  Додано новий endpoint (POST `/permissions/query/entities/grants`), що дозволяє отримати список дозволів для обробки рахунків-фактур у поточному контексті (дозволи, що повертаються: `InvoiceWrite`, `InvoiceRead` - надані іншим суб'єктом).

- **Аутентифікація**  
  Розширено відповідь POST `/auth/challenge` властивістю `clientIp`, що повертає IP-адресу клієнта, зареєстровану KSeF. Значення може бути безпосередньо використане для побудови `AuthorizationPolicy` в наступних кроках аутентифікації.

- **OpenAPI**  
  - Розширено відповіді `401 Unauthorized` і `403 Forbidden` стандартизованим форматом помилки "Problem Details" (`application/problem+json`). Додано схеми `UnauthorizedProblemDetails` та `ForbiddenProblemDetails`. `ForbiddenProblemDetails` надає, зокрема, властивість `reasonCode` та опціональний об'єкт `security` для додаткової інформації.
  - Відновлено (стосується лише специфікації OpenAPI) `additionalProperties` для словникових полів: `InvoiceStatusInfo.extensions` та `PartUploadRequest.headers`.
  - Незначні оновлення описів.

- **Експорт пакету рахунків-фактур (POST `/invoices/exports`).**  
  Виправлено генерування файлу `_metadata.json` у пакеті експорту - при великій кількості рахунків-фактур файл міг бути раніше обрізаний (некоректний JSON).

### Версія 2.1.2

- **Надсилання рахунків-фактур**  
  Додано підтримку рахунків-фактур RR ([схема_RR(1)_v1-0E](/faktury/schemy/RR/schemat_RR(1)_v1-0E.xsd)).

- **Генерування нового токена (POST `/tokens`)**  
  У моделі запиту (`GenerateTokenRequest`) розширено властивість `permissions` (enum `TokenPermissionType`) значенням `Introspection`, що дозволяє надати цей дозвіл при генеруванні токена.

- **Експорт пакету рахунків-фактур (POST `/invoices/exports`). Отримання списку метаданих рахунків-фактур (POST `/invoices/query/metadata`)**   
  Виправлено інтерпретацію параметрів `dateRange.from` / `dateRange.to`, що передаються без зсуву. Значення без часової зони тепер однозначно інтерпретуються згідно з документацією (місцевий час Europe/Warsaw).

- **OpenAPI**  
  Видалено `additionalProperties`: `false` у вибраних моделях. Зміна, що впорядковує специфікацію та робить контракт більш гнучким - допускає можливість появи додаткових властивостей у запитах або відповідях (наприклад, у рамках розширень). Додавання нової властивості не розглядається як порушення контракту; клієнти API повинні ігнорувати невідомі властивості.

### Версія 2.1.1

- **Аутентифікація**  
  - **Отримання статусу аутентифікації (GET `/auth/{referenceNumber}`)** та **Отримання списку активних сесій (GET `/auth/sessions`)**  
  Доповнено визначення `authenticationMethodInfo` - позначено властивості `category`, `code` та `displayName` як `required` у моделі відповіді.
  - **Аутентифікація з використанням підпису XAdES (POST `/auth/xades-signature`)**  
  Додано можливість раннього увімкнення нових вимог валідації XAdES на середовищах DEMO і PRD через заголовок: `X-KSeF-Feature`: `enforce-xades-compliance`.

### Версія 2.1.0

- **Аутентифікація**  
  - Додано інтеграцію з Національним Вузлом (login.gov.pl). Endpoint, що використовується для цієї інтеграції, не є публічно доступним (метод аутентифікації призначений виключно для державних додатків).
  - **Отримання статусу аутентифікації (GET `/auth/{referenceNumber}`)** та **Отримання списку активних сесій (GET `/auth/sessions`)**  
    - Позначено у моделі відповіді властивість `authenticationMethod` як `deprecated`. Планується вилучення: `2026-11-16`. Для збереження сумісності контракту в перехідний період значення `TrustedProfile` охоплює як "Довірений профіль", так і аутентифікації, що реалізуються через Національний Вузол.
    - Додано нову властивість `authenticationMethodInfo` як гнучкий опис методу аутентифікації: 
      - `category` - категорія методу аутентифікації (enum: `XadesSignature`, `NationalNode`, `Token`, `Other`), 
      - `code` - код методу аутентифікації (string), 
      - `displayName` - назва методу аутентифікації для відображення користувачу (string).
    - Розширено можливі значення поля details для статусу `460` ("Аутентифікація завершена невдачею через помилку сертифіката"): "Сертифікат призупинений".

  - **Аутентифікація з використанням підпису XAdES (POST `/auth/xades-signature`)**  
    Уніфіковано та посилено валідацію [підпису XAdES](/auth/podpis-xades.md) в процесі аутентифікації, щоб приймалися виключно підписи, що відповідають вимогам профілів XAdES.  
    Нові вимоги вже діють на середовищі TEST. На середовищах DEMO і PRD почнуть діяти **16 березня 2026** (рекомендуємо перевірити інтеграцію на TEST до цієї дати).

- **Тестові дані**  
  Додано нові endpoints:
    - POST `/testdata/context/block` - "Блокує можливість аутентифікації для зазначеного контексту. Аутентифікація завершиться помилкою 480.",
    - POST `/testdata/context/unblock` - розблоковує можливість аутентифікації для поточного контексту.

- **OpenAPI**  
  Незначні оновлення описів.

### Версія 2.0.1

- **Дозволи**
  - Отримання списку власних дозволів (POST `/permissions/query/personal/grants`).  
    - Виправлено логіку повернення списку "Мої дозволи" для власника контексту - в результатах повертаються також суб'єктні дозволи на виставлення та перегляд рахунків-фактур (`InvoiceWrite`, `InvoiceRead`) надані **без права** подальшої передачі `canDelegate = false`. Раніше список повертав лише ті з правом на подальшу передачу.
    - Додано опис для значення `InternalId` у `PersonalPermissionsContextIdentifierType`; 
    - Оновлено обмеження довжини `PersonalPermissionsContextIdentifier.value` (`maxLength` з 10 на 16).
  - Виправлено приклади в документації OpenAPI для endpoints дозволів.

- **Отримання рахунків-фактур**  
  Уточнено валідацію `dateRange` в `InvoiceQueryFilters`: діапазон 3 місяці вважається правильним, якщо він міститься в трьох місяцях в UTC або в польському часі.

- **Надсилання рахунків-фактур**
  - Валідація номера NIP  
    Додано перевірку контрольної суми NIP для: `Podmiot1`, `Podmiot2`, `Podmiot3` та `PodmiotUpowazniony` (якщо присутній) - стосується лише виробничого середовища.
  - Валідація NIP у внутрішньому ідентифікаторі  
    Додано перевірку контрольної суми NIP в `InternalId` для `Podmiot3` (якщо ідентифікатор присутній) - стосується лише виробничого середовища.
  - Оновлення [документації](/faktury/weryfikacja-faktury.md).

- **OpenAPI**  
  Незначні оновлення описів.

### Версія 2.0.0

- **UPO**  
  Згідно з оголошенням з RC6.0, з `2025-12-22` за замовчуванням повертається версія UPO v4-3.

- **Статус сесії** (GET `/sessions/{referenceNumber}`)  
  - Розширено модель відповіді властивостями `dateCreated` ("Дата створення сесії") та `dateUpdated` ("Дата останньої активності в рамках сесії").

- **Закриття пакетної сесії (POST `/sessions/batch/{referenceNumber}/close`)**   
  - Додано код помилки `21208` ("Час очікування на запити upload або finish був перевищений").

- **Отримання рахунку-фактури/UPO**
  - Додано заголовок `x-ms-meta-hash` (хеш `SHA-256`, `Base64`) у відповідях `200` для endpoints:
    - GET `/invoices/ksef/{ksefNumber}`,
    - GET `/sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`,
    - GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`,
    - GET `/sessions/{referenceNumber}/upo/{upoReferenceNumber}`.

- **Отримання статусу аутентифікації** (GET `/auth/{referenceNumber}`)
  - Доповнено документацію HTTP 400 (Bad Request) кодом помилки `21304` ("Відсутність аутентифікації") - операція аутентифікації з референсним номером {`referenceNumber`} не була знайдена.
  - Розширено статус `450` ("Аутентифікація завершена невдачею через неправильний токен") додатковою причиною: "Неправильний авторизаційний виклик".

- **Отримання токенів доступу** (POST `/auth/token/redeem`)  
  Доповнено документацію HTTP 400 (Bad Request) кодами помилок:
    - `21301` - "Відсутність авторизації":
      - Токени для операції {`referenceNumber`} вже були отримані,
      - Статус аутентифікації ({`operation.Status`}) не дозволяє отримання токенів,
      - Токен KSeF був скасований.
    - `21304` - "Відсутність аутентифікації" - Операція аутентифікації {`referenceNumber`} не була знайдена, 
    - `21308` - "Спроба використання авторизаційних методів померлої особи".

- **Оновлення токена доступу** (POST `/auth/token/refresh`)  
  Доповнено документацію HTTP 400 (Bad Request) кодами помилок:
    - `21301` - "Відсутність авторизації":
      - Статус аутентифікації ({`operation.Status`}) не дозволяє отримання токенів,
      - Токен KSeF був скасований.
    - `21304` - "Відсутність аутентифікації" - Операція аутентифікації {`referenceNumber`} не була знайдена, 
    - `21308` - "Спроба використання авторизаційних методів померлої особи".

- **Інтерактивне надсилання** (POST `/sessions/online/{referenceNumber}/invoices`)  
  Доповнено документацію кодів помилок:
    - `21402` "Неправильний розмір файлу" - довжина контенту не збігається з розміром файлу, 
    - `21403` „Неправильний хеш файлу" - хеш контенту не збігається з хешем файлу.

- **Експорт пакету рахунків-фактур (POST `/invoices/exports`). Отримання списку метаданих рахунків-фактур (POST `/invoices/query/metadata`)**  
  Зменшено максимально дозволений діапазон `dateRange` з 2 років до 3 місяців.

- **Дозволи**  
  - Додано атрибут `required` для властивості `subjectDetails` ("Дані суб'єкта, якому надаються дозволи") у всіх endpoints надання дозволів (`/permissions/.../grants`).
  - Додано атрибут `required` для властивості `euEntityDetails` ("Дані унійного суб'єкта, в контексті якого надаються дозволи") в endpoint POST `/permissions/eu-entities/administration/grants` ("Надання дозволів адміністратора унійного суб'єкта").  
  - Додано значення `PersonByFingerprintWithIdentifier` ("Фізична особа, що користується сертифікатом, що не містить ідентифікатор NIP або PESEL, але має NIP або PESEL") до enum `EuEntityPermissionSubjectDetailsType` в endpoint POST `/permissions/eu-entities/administration/grants` ("Надання дозволів адміністратора унійного суб'єкта").    
  - Змінено тип властивості `subjectEntityDetails` на `PermissionsSubjectEntityByIdentifierDetails` ("Дані уповноваженого суб'єкта") в моделі відповіді в POST `/permissions/query/authorizations/grants` ("Отримання списку суб'єктних дозволів для обробки рахунків-фактур").  
  - Змінено тип властивості `subjectEntityDetails` на `PermissionsSubjectEntityByFingerprintDetails` ("Дані уповноваженого суб'єкта") в моделі відповіді в POST `/permissions/query/eu-entities/grants` ("Отримання списку дозволів адміністраторів або представників унійних суб'єктів, уповноважених на самофактурування").  
  - Змінено тип властивості `subjectPersonDetails` на `PermissionsSubjectPersonByFingerprintDetails` ("Дані уповноваженої особи") в моделі відповіді в POST `/permissions/query/eu-entities/grants` ("Отримання списку дозволів адміністраторів або представників унійних суб'єктів, уповноважених на самофактурування").    
  - Введено валідацію контрольної суми для ідентифікатора `InternalId` в POST `/permissions/subunits/grants` ("Надання дозволів адміністратора підпорядкованого суб'єкта").
  - Уточнено описи властивостей.

- **OpenAPI**  
  - Доповнено документацію відповіді `429` заголовком, що повертається, `Retry-After` та тілом відповіді `TooManyRequestsResponse`.
  - Уточнено описи властивостей типу `byte` - значення передаються як бінарні дані, закодовані у форматі `Base64`.
  - Виправлено опечатки в специфікації.

### Версія 2.0.0 RC6.1

- **Нова адресація середовищ**  
  Надання нових адрес. Зміни в розділі [середовища KSeF API 2.0](srodowiska.md).

- **Аутентифікація - отримання статусу (GET `/auth/{referenceNumber}`)**  
  Додано код `480` - Аутентифікація заблокована: "Підозра інциденту безпеки. Зв'яжіться з Міністерством фінансів через форму звернення."

- **Дозволи**  
  - Розширено правила доступу для операцій сесій (GET/POST `/sessions/...`): до списку прийнятих дозволів додано `EnforcementOperations` (орган стягнення).
  - Додано обмеження довжини для властивостей типу string: `minLength` та `maxLength`.
  - Додано `id` (`Asc`) як другий ключ сортування в метаданих `x-sort` для запитів пошуку дозволів. Порядок за замовчуванням: `dateCreated` (`Desc`), потім `id` (`Asc`) - порядкова зміна, що збільшує детермінованість пагінації.
  - Додано валідацію властивості `IdDocument.country` в endpoint POST `/permissions/persons/grants` ("Надання фізичним особам дозволів для роботи в KSeF") - вимагається відповідність **ISO 3166-1 alpha-2** (наприклад, `PL`, `DE`, `US`).
  - "Отримання списку дозволів адміністраторів або представників унійних суб'єктів, уповноважених на самофактурування" (POST `/permissions/query/eu-entities/grants`):
    - видалено валідацію pattern (regex) та уточнено опис властивості `EuEntityPermissionsQueryRequest.authorizedFingerprintIdentifier`.
    - уточнено опис властивості `EuEntityPermissionsQueryRequest.vatUeIdentifier`.

- **Інтерактивна сесія**  
  Додано нові коди помилок для POST `/sessions/online/{referenceNumber}/invoices` ("Надсилання рахунку-фактури"):
    - `21166` - Технічне виправлення недоступне.
    - `21167` - Статус рахунку-фактури не дозволяє технічне виправлення.

- **Ліміти API**  
  - Збільшено погодинний ліміт для групи `invoiceStatus` (отримання статусу рахунку-фактури з сесії) з 720 на 1200 req/h: 
    - GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}.
  - Збільшено погодинний ліміт для групи `sessionMisc` (ресурси GET `/sessions/*`) з 720 до 1200 req/h:
    - GET `/sessions/{referenceNumber}`, 
    - GET `/sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`,
    - GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`,
    - GET `/sessions/{referenceNumber}/upo/{upoReferenceNumber}`.
  - Зменшено погодинний ліміт для групи `batchSession` (відкриття/закриття пакетної сесії) з 120 на 60 req/h: 
    - POST `/sessions/batch`, 
    - POST `/sessions/batch/{referenceNumber}/close`.
  - Збільшено ліміти для endpoint `/invoices/exports/{referenceNumber}` ("Отримання статусу експорту пакету рахунків-фактур") через додавання нової групи `invoiceExportStatus` з параметрами: 10 req/s, 60 req/min, 600 req/h.

- **Відкриття пакетної сесії (POST `/sessions/batch`)**  
  Видалено з моделі `BatchFilePartInfo` властивість `fileName` (раніше позначену як deprecated; x-removal-date: 2025-12-07).

- **Ініціалізація аутентифікації (POST `/auth/challenge`)**  
  Додано властивість `timestampMs` (int64) в моделі відповіді - час генерування challenge в мілісекундах від 1.01.1970 (Unix).

- **Тестові дані**
  - Уточнено тип властивості `expectedEndDate`: format: `date` в (POST `/testdata/attachment/revoke`).
  - Видалено значення `Token` з enum `SubjectIdentifierType` в endpoint POST `/testdata/limits/subject/certificate`. Значення не використовувалося: в KSeF суб'єкт не може бути "токеном" - ідентичність завжди випливає з `NIP/PESEL` або відбитка пальця сертифіката, який несе ідентичність суб'єкта, що його створив.

- **OpenAPI**  
  Збільшено максимальне значення `pageSize` з 500 до 1000 для endpoints:
  - GET `/sessions`
  - GET `/sessions/{referenceNumber}/invoices`
  - GET `/sessions/{referenceNumber}/invoices/failed`

### Версія 2.0.0 RC6.0

- **Ліміти API**  
  - На середовищі **TE** (тестове) увімкнено і визначено політику [лімітів api](limity/limity-api.md) зі значеннями в 10 разів вищими ніж на **PRD**; деталі: ["Ліміти на середовищах"](/limity/limity-api.md#limity-na-środowiskach).
  - На середовищі **TR** (DEMO) увімкнено [ліміти api](limity/limity-api.md) зі значеннями ідентичними як на **PRD**. Значення реплікуються з виробництва; деталі: ["Ліміти на середовищах"](/limity/limity-api.md#limity-na-środowiskach).
  - Додано endpoint POST `/testdata/rate-limits/production` - встановлює в поточному контексті значення лімітів api відповідно до виробничого профілю. Доступний лише на середовищі **TE**.
  
- **Експорт пакету рахунків-фактур (POST `/invoices/exports`). Отримання списку метаданих рахунків-фактур (POST `/invoices/query/metadata`)**   
  - Додано документ [High Water Mark (HWM)](pobieranie-faktur/hwm.md), що описує механізм управління повнотою даних у часі.
  - Оновлено [Прирістне отримання рахунків-фактур](pobieranie-faktur/przyrostowe-pobieranie-faktur.md) рекомендаціями використання механізму `HWM`.
  - Розширено модель відповіді властивістю `permanentStorageHwmDate` (string, date-time, nullable). Стосується виключно запитів з `dateType = PermanentStorage` і означає точку, нижче якої дані є повними; для `dateType = Issue/Invoicing` - null.  
  - Додано властивість `restrictToPermanentStorageHwmDate` (boolean, nullable) в об'єкті `dateRange`, який вмикає механізм High Water Mark (`HWM`) і обмежує діапазон дат до поточного значення `HWM`. Стосується виключно запитів з `dateType = PermanentStorage`. Застосування параметра значно зменшує дублікати між послідовними експортами і забезпечує узгодженість під час тривалої прирістної синхронізації.

- **UPO - оновлення XSD до v4-3**
  - Змінено шаблон (`pattern`) елемента `NumerKSeFDokumentu`, щоб допускати також номери KSeF, згенеровані для рахунків-фактур з KSeF 1.0 (36 символів).
  - Додано елемент `TrybWysylki` - режим передачі документа до KSeF: `Online` або `Offline`.
  - Змінено значення `NazwaStrukturyLogicznej` на формат: Schemat_{systemCode}_v{schemaVersion}.xsd (наприклад, Schemat_FA(3)_v1-0E.xsd).
  - Змінено значення `NazwaPodmiotuPrzyjmujacego` на тестових середовищах через додавання суфіксу з назвою середовища:
    - `TE`: Ministerstwo Finansów - środowisko testowe (TE),
    - `TR`: Ministerstwo Finansów - środowisko przedprodukcyjne (TR).
    
    `PRD`: без змін - Ministerstwo Finansów.  
  - Зараз за замовчуванням повертається UPO v4-2. Щоб отримати UPO v4-3, потрібно додати заголовок: `X-KSeF-Feature: upo-v4-3` при відкритті сесії (online/пакетної).
  - З `2025-12-22` версією за замовчуванням буде UPO v4-3.
  - XSD UPO v4-3: [schema](/faktury/upo/schemy/upo-v4-3.xsd).

- **Статус сесії** (GET `/sessions/{referenceNumber}`)  
    Уточнено опис коду `440` - Сесія скасована: можливі причини - "Перевищено час надсилання" або "Не надіслано рахунків-фактур".

- **Статус рахунку-фактури** (GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}`)  
    Додано тип `InvoiceStatusInfo` (розширює `StatusInfo`) полем `extensions` - об'єкт зі структурованими деталями статусу. Поле `details` залишається без змін. Приклад (дублікат рахунку-фактури):
    
    ```json
    "status": {
      "code": 440,
      "description": "Дублікат рахунку-фактури",
      "details": [
        "Дублікат рахунку-фактури. Рахунок-фактура з номером KSeF: 5265877635-20250626-010080DD2B5E-26 вже була правильно надіслана до системи в сесії: 20250626-SO-2F14610000-242991F8C9-B4"
      ],
      "extensions": {
        "originalSessionReferenceNumber": "20250626-SO-2F14610000-242991F8C9-B4",
        "originalKsefNumber": "5265877635-20250626-010080DD2B5E-26"
      }
    }    
    ```

- **Дозволи**  
    Додано властивість `subjectDetails` - "Дані суб'єкта, якому надаються дозволи" до всіх endpoints надання дозволів (/permissions/.../grants). У RC6.0 поле опціональне; з 2025-12-19 буде обов'язковим.

- **Пошук наданих дозволів** (POST `/permissions/query/authorizations/grants`)  
    Розширено правила доступу `PefInvoiceWrite`.

- **Тестові дані - додатки (POST /testdata/attachment/revoke)**  
  Розширено модель запиту `AttachmentPermissionRevokeRequest` полем `expectedEndDate` (опціональне) - дата відкликання згоди на надсилання рахунків-фактур з додатком.

- **OpenAPI**  
  - Додано відповідь HTTP `429` - "Too Many Requests" до всіх endpoints. У властивості `description` цієї відповіді публікується табличне представлення лімітів (`req/s`, `req/min`, `req/h`) та назв групи лімітів, присвоєної endpoint. Механізм і семантика `429` залишаються відповідними опису в документації [лімітів](/limity/limity-api.md).
  - До кожного endpoint додано метадані `x-rate-limits` зі значеннями лімітів (`req/s`, `req/min`, `req/h`).
  - Видалено явні властивості `exclusiveMaximum`: `false` і `exclusiveMinimum`: `false` з числових визначень (залишено лише minimum/maximum). Порядкова зміна – без впливу на валідацію (в OpenAPI значення за замовчуванням цих властивостей - `false`).
  - Додано обмеження довжини для властивостей типу string: `minLength`.
  - Видалено явні налаштування `style`: `form` для параметрів в in: query.
  - Змінено порядок значень enum `BuyerIdentifierType` (зараз: `None`, `Other`, `Nip`, `VatUe`). Порядкова зміна - без впливу на роботу.
  - Виправлено опечатку в описі властивості `KsefNumber`.
  - Уточнено формат властивості `PublicKeyCertificate`, що представляє бінарні дані, закодовані `Base64`, встановлено format: `byte`.
  - Внесено незначні мовні та пунктуаційні корективи в поля `description`.

### Версія 2.0.0 RC5.7

- **Відкриття пакетної сесії (POST `/sessions/batch`)**  
  Позначено в моделі запиту `BatchFilePartInfo.fileName` як `deprecated` (планується видалення: 2025-12-05).

- **Статуси асинхронних операцій**  
  Додано статус `550` - "Операція була скасована системою". Опис: "Обробка була перервана з внутрішніх причин системи. Спробуйте знову."

- **OpenAPI**  
  - Додано обмеження кількості елементів в масиві: `minItems`, `maxItems`.
  - Додано обмеження довжини для властивостей типу string: `minLength` та `maxLength`.  
  - Оновлено описи властивостей (`invoiceMetadataAuthorizedSubject.role`, `invoiceMetadataBuyer`, `invoiceMetadataThirdSubject.role`, `buyerIdentifier`).
  - Оновлено regex шаблони для `vatUeIdentifier`, `authorizedFingerprintIdentifier`, `internalId`, `nipVatUe`, `peppolId`.

### Версія 2.0.0 RC5.6

- **Отримання статусу сесії (GET `/sessions/{referenceNumber}`)**  
  Додано у відповіді поле `UpoPageResponse.downloadUrlExpirationDate` - дата та час закінчення строку дії адреси отримання UPO; після цього моменту `downloadUrl` вже не активний.

- **Отримання списку метаданих сертифікатів (POST `/certificates/query`)**  
  Розширено відповідь (`CertificateListItem`) властивістю `requestDate` - дата подачі сертифікаційної заяви.

- **Отримання списку постачальників послуг Peppol (GET `/peppol/query`)**  
  - Розширено модель відповіді полем `dateCreated` - дата реєстрації постачальника послуг Peppol у системі.
  - Позначено властивості `dateCreated`, `id`, `name` в моделі відповіді як такі, що завжди повертаються.
  - Визначено схему `PeppolId` (string, 9 символів) і застосовано в `PeppolProvider`.

- **OpenAPI**  
  - Додано метадані `x-sort` до всіх endpoints, що повертають списки. В описах endpoints додано розділ Сортування з порядком за замовчуванням (наприклад, "requestDate (Desc)").
  - Додано обмеження довжини для властивостей типу string: `minLength` та `maxLength`.
  - Уточнено формат властивостей, що представляють бінарні дані, закодовані `Base64`: встановлено format: `byte` (`encryptedInvoiceContent`, `encryptedSymmetricKey`, `initializationVector`, `encryptedToken`).
  - Визначено загальну схему `Sha256HashBase64` і застосовано її до всіх властивостей, що представляють хеш `SHA-256` в `Base64` (зокрема `invoiceHash`).
  - Визначено загальну схему `ReferenceNumber` (string, довжина 36) і застосовано її до всіх параметрів і властивостей, що представляють референсний номер асинхронної операції (в шляхах, запитах і відповідях).
  - Визначено загальну схему `Nip` (string, 10 символів, regex pattern) і застосовано її до всіх властивостей, що представляють NIP.
  - Визначено схему `Pesel` (string, 11 символів, regex pattern) і застосовано її у властивості, що представляє PESEL.
  - Визначено загальну схему `KsefNumber` (string, 35-36 символів, regex pattern) і застосовано її до всіх властивостей, що представляють номер KSeF.  
  - Визначено схему `Challenge` (string, 36 символів) і застосовано в `AuthenticationChallengeResponse`.`challenge`.
  - Визначено загальну схему `PermissionId` (string, 36 символів) і застосовано її у всіх місцях: в параметрах та у властивостях відповідей.
  - Додано регулярні вирази для вибраних текстових полів.

### Версія 2.0.0 RC5.5

- **Отримання поточних лімітів API (GET `/api/v2/rate-limits`)**  
  Додано endpoint, що повертає ефективні ліміти викликів API в розкладі `perSecond`/`perMinute`/`perHour` для окремих областей (зокрема `onlineSession`, `batchSession`, `invoiceSend`, `invoiceStatus`, `invoiceExport`, `invoiceDownload`, `other`).

- **Статус рахунку-фактури в сесії**  
  Розширено відповідь для GET `/sessions/{referenceNumber}/invoices` ("Отримання рахунків-фактур сесії") та GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}` ("Отримання статусу рахунку-фактури з сесії") властивостями: `upoDownloadUrlExpirationDate` - "дата та час закінчення строку дії адреси. Після цієї дати посилання `UpoDownloadUrl` більше не буде активним". Розширено опис `upoDownloadUrl`.

- **Видалення полів \*InMib (зміна згідно з оголошенням з 5.3)**  
  Видалено властивості `maxInvoiceSizeInMib` та `maxInvoiceWithAttachmentSizeInMib`.
  Зміна стосується:
    - GET `/limits/context` – відповідей (`onlineSession`, `batchSession`),
    - POST `/testdata/limits/context/session` – моделі запиту (`onlineSession`, `batchSession`),
    - Моделей: `BatchSessionContextLimitsOverride`, `BatchSessionEffectiveContextLimits`, `OnlineSessionContextLimitsOverride`, `OnlineSessionEffectiveContextLimits`.
  Для вказання розмірів використовуються виключно поля *InMB (1 MB = 1 000 000 B).

- **Видалення `operationReferenceNumber` (зміна згідно з оголошенням з 5.3)**  
  Видалено властивість `operationReferenceNumber` з моделі відповіді; єдиною обов'язковою назвою є `referenceNumber`. Зміна включає:
  - GET `/invoices/exports/{referenceNumber}` - "Статус експорту пакету рахунків-фактур",
  - POST `/permissions/operations/{referenceNumber}` - "Отримання статусу операції дозволів".

- **Експорт пакету рахунків-фактур (POST `/invoices/exports`)**  
  - Додано новий код помилки: `21182` - "Досягнуто ліміт триває експортів. Для аутентифікованого суб'єкта в поточному контексті досягнуто максимальний ліміт {count} одночасних експортів рахунків-фактур. Спробуйте пізніше".
  - Розширено модель відповіді властивістю `packageExpirationDate`, що вказує дату закінчення строку дії підготовленого пакету. Після закінчення цієї дати пакет не буде доступний для завантаження.
  - Додано код помилки `210` - "Експорт рахунків-фактур закінчився і більше не доступний для завантаження".

- **Статус експорту пакету рахунків-фактур (GET `/invoices/exports/{referenceNumber}`)**  
  Уточнено описи полів посилань для завантаження частин пакету:
  - `url` - "URL-адреса, за якою потрібно надіслати запит на завантаження частини пакету. Посилання генерується динамічно в момент запиту статусу операції експорту. Не підлягає лімітам API і не потребує передавання токена доступу при завантаженні".
  - `expirationDate` - "Дата та час закінчення строку дії посилання, що дозволяє завантаження частини пакету. Після закінчення цього моменту посилання перестає бути активним".

- **Авторизація**
  - Розширено правила доступу `SubunitManage` для POST `/permissions/query/persons/grants`: операцію можна виконати, якщо суб'єкт має `CredentialsManage`, `CredentialsRead`, `SubunitManage`.
  - Надання дозволів непрямим способом (POST `/permissions/indirect/grants`)
    Оновлено опис властивості `targetIdentifier.description`: уточнено, що відсутність ідентифікатора контексту означає надання непрямого дозволу загального типу.

- **OpenAPI**  
  Збільшено максимальне значення `pageSize` зі 100 до 500 для endpoints:
  - GET `/sessions`
  - GET `/sessions/{referenceNumber}/invoices`
  - GET `/sessions/{referenceNumber}/invoices/failed`

### Версія 2.0.0 RC5.4

- **Отримання списку метаданых рахунків-фактур (POST /invoices/query/metadata)**  
  - Додано параметр `sortOrder`, що дозволяє визначити напрямок сортування результатів.

- **Статус сесії**  
  Видалено помилку, що перешкоджала заповненню цієї властивості у відповідях API щодо рахунків-фактур (поле раніше не поверталося). Значення заповнюється асинхронно в момент постійного запису і може бути тимчасово null.

- **Тестові дані (лише на тестових середовищах)**
  - Зміна лімітів API для поточного контексту (POST `testdata/rate-limits`)  
  Додано endpoint, що дозволяє тимчасово перевизначити ефективні ліміти API для поточного контексту. Зміна готує запуск симулятора лімітів на середовищі TE.
  - Відновлення лімітів за замовчуванням (DELETE `/testdata/rate-limits`)
  Додано endpoint, що відновлює значення лімітів за замовчуванням для поточного контексту.

- **OpenAPI**  
  - Уточнено визначення табличних параметрів в query; застосовано `style: form`. Декілька значень потрібно передавати через повторення параметра, наприклад `?statuses=InProgress&statuses=Succeeded`. Документаційна зміна, без впливу на роботу API.
  - Оновлено описи властивостей (`partUploadRequests`, `encryptedSymmetricKey`, `initializationVector`).

### Версія 2.0.0 RC5.3

- **Експорт пакету рахунків-фактур (POST `/invoices/exports`)**  
  Додано можливість долучення файлу `_metadata.json` до пакету експорту. Файл має вигляд об'єкта JSON з масивом `invoices`, що містить об'єкти `InvoiceMetadata` (модель, що повертається POST `/invoices/query/metadata`).
  Увімкнення (preview): до заголовка запиту потрібно додати `X-KSeF-Feature`: `include-metadata`.
  З 2025-10-27 змінюється поведінка за замовчуванням endpoint - пакет експорту завжди міститиме файл `_metadata.json` (заголовок не буде потрібен).

- **Статус рахунку-фактури**  
  - У випадку обробки з помилкою, коли можливо було прочитати номер рахунку-фактури (наприклад, код помилки `440` - дублікат рахунку-фактури), відповідь містить властивість `invoiceNumber` з прочитаним номером.
  - Позначено властивості `invoiceHash`, `referenceNumber` в моделі відповіді як такі, що завжди повертаються.

- **Стандартизація одиниць розміру (MB, SI)**  
  Уніфіковано запис лімітів у документації та API: значення подані в MB (SI), де 1 MB = 1 000 000 B.

- **Отримання лімітів для поточного контексту (GET `/limits/context`)**  
  Додано в моделі відповіді `maxInvoiceSizeInMB`, `maxInvoiceWithAttachmentSizeInMB` для властивостей `onlineSession` і `batchSession`.
  Властивості `maxInvoiceSizeInMib`, `maxInvoiceWithAttachmentSizeInMib` позначено як deprecated (планується видалення: 2025-10-27).

- **Зміна лімітів сесії для поточного контексту (POST `/testdata/limits/context/session`)**  
  Додано в моделі запиту `maxInvoiceSizeInMB`, `maxInvoiceWithAttachmentSizeInMB` для властивостей `onlineSession` і `batchSession`.
  Властивості `maxInvoiceSizeInMib`, `maxInvoiceWithAttachmentSizeInMib` позначено як deprecated (планується видалення: 2025-10-27).

- **Статус експорту пакету рахунків-фактур (GET `/invoices/exports/{referenceNumber}`)**  
  Зміна назви параметра шляху з `operationReferenceNumber` на `referenceNumber`.  
  Зміна не впливає на контракт HTTP (шлях і значення без змін) та на поведінку endpoint.

- **Дозволи**  
  - Оновлено описи endpoints приклади endpoints з області permissions/*. Зміна стосується виключно документації (уточнення описів, форматів і прикладів); без змін у поведінці API та контракті.
  - Зміна назви параметра шляху з `operationReferenceNumber` на `referenceNumber` у "Отримання статусу операції" (POST `/permissions/operations/{referenceNumber}`).  
  Зміна не впливає на контракт HTTP (шлях і значення без змін) та на поведінку endpoint.
  - "Надання дозволів непрямим способом" (POST `permissions/indirect/grants`)  
    Додано підтримку внутрішнього ідентифікатора - розширено властивість `targetIdentifier` значенням `InternalId`.
  - "Отримання списку власних дозволів" (POST `/permissions/query/personal/grants`)  
      - Розширено в моделі запиту властивість `targetIdentifier` значенням `InternalId` (можливість вказання внутрішнього ідентифікатора).
      - Видалено в моделі відповіді значення `PersonalPermissionScope.Owner`. Власницькі дозволи (надані через ZAW-FA або прив'язка NIP/PESEL) не повертаються.

- **Статус аутентифікації (GET `/auth/{referenceNumber}`)**  
  Розширено таблицю кодів помилок `470` - "Аутентифікація завершена невдачею" з уточненням: "Спроба використання авторизаційних методів померлої особи".

- **Обробка рахунків-фактур PEF**  
  Змінено значення enum (`FormCode`):
    - `FA_PEF (3)` на `PEF (3)`,
    - `FA_KOR_PEF (3)` на `PEF_KOR (3)`.

- **Генерування нового токена (POST `/tokens`)**  
  - В моделі запиту (`GenerateTokenRequest`) позначено поля `description` і `permissions` як обов'язкові.
  - В моделі відповіді (`GenerateTokenResponse`) позначено поля `referenceNumber` і `token` як такі, що завжди повертаються.

- **Статус токена KSeF (GET /tokens/{referenceNumber})**
  - Позначено властивості `authorIdentifier`, `contextIdentifier`, `dateCreated`, `description`, `referenceNumber`, `requestedPermissions`, `status` в моделі відповіді як такі, що завжди повертаються.

- **Отримання списку згенерованих токенів (GET /tokens)**
  - Позначено властивості `authorIdentifier`, `contextIdentifier`, `dateCreated`, `description`, `referenceNumber`, `requestedPermissions`, `status` в моделі відповіді як такі, що завжди повертаються.

- **Тестові дані - створення фізичної особи (POST `/testdata/person`)**  
  Розширено запит властивістю `isDeceased` (boolean), що дозволяє створити тестову померлу особу (наприклад, для сценаріїв перевірки коду статусу `470`).

- **OpenAPI**
  - Уточнено обмеження для властивостей типу integer в requests через додавання атрибутів `minimum` / `exclusiveMinimum`, `maximum` / `exclusiveMaximum`.  
  - Розширено відповідь полем `referenceNumber` (містить те саме значення, що й попереднє `operationReferenceNumber`). Позначено `operationReferenceNumber` як `deprecated` і буде видалено з відповіді 2025-10-27; потрібно перейти на `referenceNumber`. Характер зміни: перехідний rename із збереженням сумісності (обидві властивості повертаються паралельно до дати видалення).  
  Стосується endpoints:
    - POST `/permissions/persons/grants`,
    - POST `/permissions/entities/grants`,
    - POST `/permissions/authorizations/grants`,
    - POST `/permissions/indirect/grants`,
    - POST `/permissions/subunits/grants`,
    - POST `/permissions/eu-entities/administration/grants`,
    - POST `/permissions/eu-entities/grants`,
    - DELETE `/permissions/common/grants/{permissionId}`,
    - DELETE `/permissions/authorizations/grants/{permissionId}`,
    - POST `/invoices/exports`.
  - Видалено атрибут `required` з властивості `pageSize` в запиті GET `/sessions` ("Отримання списку сесій").
  - Оновлено приклади (example) у визначеннях endpoints.

### Версія 2.0.0 RC5.2
- **Дозволи** 
  - "Надання дозволів адміністратора підпорядкованого суб'єкта" (POST `/permissions/subunits/grants`)  
  Додано властивість `subunitName` ("Назва підпорядкованої одиниці") у запиті. Поле обов'язкове, коли підпорядкована одиниця ідентифікується внутрішнім ідентифікатором.
  - "Отримання списку дозволів адміністраторів одиниць і підпорядкованих суб'єктів" (POST `/permissions/query/subunits/grants`)  
  Додано у відповіді властивість `subunitName` ("Назва підпорядкованої одиниці").
  - "Отримання списку дозволів для роботи в KSeF, наданих фізичним особам або суб'єктам" (POST `permissions/query/persons/grants`)  
    Видалено з результатів дозвіл типу `Owner`. Дозвіл `Owner` присвоюється системно фізичній особі і не підлягає наданню, тому не повинен з'являтися в списку наданих дозволів.
  - "Отримання списку власних дозволів" (POST `/permissions/query/personal/grants`)  
    Розширено enum фільтра `PersonalPermissionType` значенням `VatUeManage`.

- **Ліміти**  
  - Додано endpoints для перевірки встановлених лімітів (контекст, аутентифікований суб'єкт):
    - GET `/limits/context`
    - GET `/limits/subject`
  - Додано endpoints для управління лімітами (контекст, аутентифікований суб'єкт) у тестовому середовищі:
    - POST/DELETE `/testdata/limits/context/session`
    - POST/DELETE `/testdata/limits/subject/certificate`
  - Оновлено [Ліміти](limity/limity.md).

- **Статус рахунку-фактури**  
  Додано властивість `invoicingMode` в моделі відповіді. Оновлено документацію: [Автоматичне визначення режиму надсилання offline](offline/automatyczne-okreslanie-trybu-offline.md).

- **OpenAPI**
  - Уточнено обмеження для властивостей типу integer в requests через додавання атрибутів `minimum` / `exclusiveMinimum`, `maximum` / `exclusiveMaximum` та значень за замовчуванням `default`.
  - Оновлено приклади (example) у визначеннях endpoints.
  - Уточнено описи endpoints.
  - Додано атрибут `required` для обов'язкових властивостей у запитах і відповідях.

### Версія 2.0.0 RC5.1

- **Отримання списку метаданих сертифікатів (POST /certificates/query)**  
  Змінено представлення ідентифікатора суб'єкта з пари властивостей `subjectIdentifier` + `subjectIdentifierType` на складний об'єкт `subjectIdentifier` { `type`, `value` }.

- **Отримання списку метаданих рахунків-фактур (POST /invoices/query/metadata)**
  - Змінено представлення вибраних ідентифікаторів з пар властивостей тип + value на складні об'єкти { type, value }: 
    - `invoiceMetadataBuyer.identifier` + `invoiceMetadataBuyer.identifierType` на складний об'єкт `invoiceMetadataBuyerIdentifier` { `type`, `value` },
    - `invoiceMetadataThirdSubject.identifier` + `invoiceMetadataThirdSubject.identifierType` на складний об'єкт `InvoiceMetadataThirdSubjectIdentifier` { `type`, `value` }.
  - Видалено `obsoleted` властивості `Identitifer` з об'єктів `InvoiceMetadataSeller` та `InvoiceMetadataAuthorizedSubject`.
  - Змінено властивість `invoiceQuerySeller` на `sellerNip` у фільтрі запиту.
  - Змінено властивість `invoiceQueryBuyer` на `invoiceQueryBuyerIdentifier` з властивостями { `type`, `value` } у фільтрі запиту.

- **Дозволи**  
  Змінено представлення вибраних ідентифікаторів з пар властивостей тип + value на складні об'єкти { type, value }: 
    - "Отримання списку власних дозволів" (POST `/permissions/query/personal/grants`):  
      - `contextIdentifier` + `contextIdentifierType` -> `contextIdentifier` { `type`, `value` },
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `targetIdentifier` + `targetIdentifierType` -> `targetIdentifier` { type, value }.  
    - "Отримання списку дозволів для роботи в KSeF, наданих фізичним особам або суб'єктам" (POST `/permissions/query/persons/grants`),
      - `contextIdentifier` + `contextIdentifierType` -> `contextIdentifier` { `type`, `value` },
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `targetIdentifier` + `targetIdentifierType` -> `targetIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }.    
    - "Отримання списку дозволів адміністраторів одиниць і підпорядкованих суб'єктів" (POST `/permissions/query/subunits/grants`):
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `subunitIdentifier` + `subunitIdentifierType` -> `subunitIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }.
    - "Отримання списку ролей суб'єкта" (POST `/permissions/query/entities/roles`):
      - `parentEntityIdentifier` + `parentEntityIdentifierType` -> `parentEntityIdentifier` { `type`, `value` }.
    - "Отримання списку підпорядкованих суб'єктів" (POST `/permissions/query/subordinate-entities/roles`):
      - `subordinateEntityIdentifier` + `subordinateEntityIdentifierType` -> `subordinateEntityIdentifier` { `type`, `value` }.
    - "Отримання списку суб'єктних дозволів для обробки рахунків-фактур" (POST `/permissions/query/authorizations/grants`):
      - `authorizedEntityIdentifier` + `authorizedEntityIdentifierType` -> `authorizedEntityIdentifier` { `type`, `value` },
      - `authorizingEntityIdentifier` + `authorizingEntityIdentifierType` -> `authorizingEntityIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }
    - "Отримання списку дозволів адміністраторів або представників унійних суб'єктів, уповноважених на самофактурування" (POST `/permissions/query/eu-entities/grants`):
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }        

- **Надання дозволів адміністратора унійного суб'єкта (POST permissions/eu-entities/administration/grants)**  
  Змінено назву властивості в запиті з `subjectName` на `euEntityName`.

- **Аутентифікація з використанням токена KSeF**  
  Видалено зайві значення enum `None`, `AllPartners` у властивості `contextIdentifier.type` запиту POST `/auth/ksef-token`.

- **Токени KSeF**  
  - Уніфіковано модель відповіді GET `/tokens`: властивості `authorIdentifier.type`, `authorIdentifier.value`, `contextIdentifier.type`, `contextIdentifier.value` завжди повертаються (required, non-nullable),
  - Видалено зайві значення enum `None`, `AllPartners` у властивостях `authorIdentifier.type` та `contextIdentifier.type` в моделі відповіді GET `/tokens` ("Отримання списку згенерованих токенів").

- **Пакетна сесія**  
  Видалено зайвий код помилки `21401` - "Документ не відповідає схемі (json)".

- **Отримання статусу сесії (GET /sessions/{referenceNumber})**  
  - Додано код помилки `420` - "Перевищений ліміт рахунків-фактур у сесії".

- **Отримання метаданих рахунків-фактур (GET `/invoices/query/metadata`)**  
  - Додано у відповіді (завжди повертається) властивість `isTruncated` (boolean) – "Визначає, чи результат був обрізаний через перевищення ліміту кількості рахунків-фактур (10 000)",
  - Позначено властивість `amount.type` у фільтрі запиту як обов'язкову.

- **Експорт пакету рахунків-фактур: замовлення (POST `/invoices/exports`)**
  - Позначено властивість `operationReferenceNumber` в моделі відповіді як таку, що завжди повертається,
  - Позначено властивість `amount.type` у фільтрі запиту як обов'язкову.

- **Отримання списку дозволів для роботи в KSeF, наданих фізичним особам або суб'єктам (POST /permissions/query/persons/grants)**  
  - Додано `contextIdentifier` у фільтрі запиту і в моделі відповіді.
