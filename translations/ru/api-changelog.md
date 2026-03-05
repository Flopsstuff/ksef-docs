---
original: api-changelog.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [api-changelog.md](https://github.com/CIRFMF/ksef-docs/blob/main/api-changelog.md)

## Изменения в API 2.0

### Версия 2.2.0

- **Разрешения**  
  Добавлен новый endpoint (POST `/permissions/query/entities/grants`), позволяющий получить список разрешений на обработку счетов в текущем контексте (возвращаемые разрешения: `InvoiceWrite`, `InvoiceRead` - предоставленные другим субъектом).

- **Аутентификация**  
  Расширен ответ POST `/auth/challenge` свойством `clientIp`, возвращающим IP-адрес клиента, зарегистрированный в KSeF. Значение может быть напрямую использовано для построения `AuthorizationPolicy` в последующих шагах аутентификации.

- **OpenAPI**  
  - Расширены ответы `401 Unauthorized` и `403 Forbidden` стандартизированным форматом ошибки "Problem Details" (`application/problem+json`). Добавлены схемы `UnauthorizedProblemDetails` и `ForbiddenProblemDetails`. `ForbiddenProblemDetails` предоставляет в том числе свойство `reasonCode` и опциональный объект `security` для дополнительной информации.
  - Восстановлены (касается только спецификации OpenAPI) `additionalProperties` для словарных полей: `InvoiceStatusInfo.extensions` и `PartUploadRequest.headers`.
  - Мелкие обновления описаний.

- **Экспорт пакета счетов (POST `/invoices/exports`).**  
  Исправлено генерирование файла `_metadata.json` в пакете экспорта - при большом количестве счетов файл мог быть ранее обрезан (некорректный JSON).

### Версия 2.1.2

- **Отправка счетов**  
  Добавлена поддержка счетов RR ([схема_RR(1)_v1-0E](/faktury/schemy/RR/schemat_RR(1)_v1-0E.xsd)).

- **Генерация нового токена (POST `/tokens`)**  
  В модели запроса (`GenerateTokenRequest`) расширено свойство `permissions` (enum `TokenPermissionType`) значением `Introspection`, позволяя предоставлять это разрешение при генерации токена.

- **Экспорт пакета счетов (POST `/invoices/exports`). Получение списка метаданных счетов (POST `/invoices/query/metadata`)**   
  Исправлена интерпретация параметров `dateRange.from` / `dateRange.to`, указанных без смещения. Значения без временной зоны теперь однозначно интерпретируются согласно документации (местное время Europe/Warsaw).

- **OpenAPI**  
  Удален `additionalProperties`: `false` в выбранных моделях. Изменение упорядочивает спецификацию и делает контракт более гибким - допускает возможность появления дополнительных свойств в запросах или ответах (например, в рамках расширений). Добавление нового свойства не рассматривается как нарушение контракта; клиенты API должны игнорировать неизвестные свойства.

### Версия 2.1.1

- **Аутентификация**  
  - **Получение статуса аутентификации (GET `/auth/{referenceNumber}`)** и **Получение списка активных сессий (GET `/auth/sessions`)**  
  Дополнено определение `authenticationMethodInfo` - помечены свойства `category`, `code` и `displayName` как `required` в модели ответа.
  - **Аутентификация с использованием подписи XAdES (POST `/auth/xades-signature`)**  
  Добавлена возможность предварительного включения новых требований валидации XAdES на средах DEMO и PRD через заголовок: `X-KSeF-Feature`: `enforce-xades-compliance`.  

### Версия 2.1.0

- **Аутентификация**  
  - Добавлена интеграция с Национальным узлом (login.gov.pl). Endpoint, используемый для этой интеграции, не является публично доступным (метод аутентификации предназначен исключительно для государственных приложений).
  - **Получение статуса аутентификации (GET `/auth/{referenceNumber}`)** и **Получение списка активных сессий (GET `/auth/sessions`)**  
    - Помечено в модели ответа свойство `authenticationMethod` как `deprecated`. Планируемое прекращение поддержки: `2026-11-16`. Для сохранения совместимости контракта в переходный период значение `TrustedProfile` включает как "Доверенный профиль", так и аутентификации, осуществляемые через Национальный узел.
    - Добавлено новое свойство `authenticationMethodInfo` как гибкое описание метода аутентификации: 
      - `category` - категория метода аутентификации (enum: `XadesSignature`, `NationalNode`, `Token`, `Other`), 
      - `code` - код метода аутентификации (string), 
      - `displayName` - название метода аутентификации для отображения пользователю (string).
    - Расширены возможные значения поля details для статуса `460` ("Аутентификация завершена неудачей из-за ошибки сертификата") о: "Сертификат приостановлен".

  - **Аутентификация с использованием подписи XAdES (POST `/auth/xades-signature`)**  
    Унифицирована и ужесточена валидация [подписи XAdES](/auth/podpis-xades.md) в процессе аутентификации, так чтобы принимались исключительно подписи, соответствующие требованиям профилей XAdES.  
    Новые требования уже действуют на среде TEST. На средах DEMO и PRD начнут действовать **16 марта 2026** (рекомендуется проверка интеграции на TEST перед этой датой).

- **Тестовые данные**  
  Добавлены новые endpointy:
    - POST `/testdata/context/block` - "Блокирует возможность аутентификации для указанного контекста. Аутентификация завершится ошибкой 480.",
    - POST `/testdata/context/unblock` - разблокирует возможность аутентификации для текущего контекста.  

- **OpenAPI**  
  Мелкие обновления описаний.

### Версия 2.0.1

- **Разрешения**
  - Получение списка собственных разрешений (POST `/permissions/query/personal/grants`).  
    - Исправлена логика возврата списка "Мои разрешения" для владельца контекста - в результатах возвращаются также субъектные разрешения на выставление и просмотр счетов (`InvoiceWrite`, `InvoiceRead`), предоставленные **без права** дальнейшей передачи `canDelegate = false`. Ранее список возвращал только те, у которых есть право на дальнейшую передачу.
    - Добавлено описание для значения `InternalId` в `PersonalPermissionsContextIdentifierType`; 
    - Обновлены ограничения длины `PersonalPermissionsContextIdentifier.value` (`maxLength` с 10 на 16).
  - Исправлены примеры в документации OpenAPI для endpoints разрешений.

- **Получение счетов**  
  Уточнена валидация `dateRange` в `InvoiceQueryFilters`: диапазон 3 месяца считается корректным, если укладывается в три месяца по UTC или по польскому времени.

- **Отправка счетов**
  - Валидация номера NIP  
    Добавлена проверка контрольной суммы NIP для: `Podmiot1`, `Podmiot2`, `Podmiot3` и `PodmiotUpowazniony` (если присутствует) - касается только производственной среды.
  - Валидация NIP во внутреннем идентификаторе  
    Добавлена проверка контрольной суммы NIP в `InternalId` для `Podmiot3` (если идентификатор присутствует) - касается только производственной среды.
  - Обновление [документации](/faktury/weryfikacja-faktury.md).

- **OpenAPI**  
  Мелкие обновления описаний.

### Версия 2.0.0

- **UPO**  
  Согласно анонсу из RC6.0, с `2025-12-22` по умолчанию возвращается версия UPO v4-3.

- **Статус сессии** (GET `/sessions/{referenceNumber}`)  
  - Расширена модель ответа свойствами `dateCreated` ("Дата создания сессии") и `dateUpdated` ("Дата последней активности в рамках сессии").  

- **Закрытие пакетной сессии (POST `/sessions/batch/{referenceNumber}/close`)**   
  - Добавлен код ошибки `21208` ("Время ожидания запросов upload или finish было превышено").

- **Получение счета/UPO**
  - Добавлен заголовок `x-ms-meta-hash` (хеш `SHA-256`, `Base64`) в ответах `200` для endpoints:
    - GET `/invoices/ksef/{ksefNumber}`,
    - GET `/sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`,
    - GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`,
    - GET `/sessions/{referenceNumber}/upo/{upoReferenceNumber}`.

- **Получение статуса аутентификации** (GET `/auth/{referenceNumber}`)
  - Дополнена документация HTTP 400 (Bad Request) кодом ошибки `21304` ("Отсутствие аутентификации") - операция аутентификации с номером {`referenceNumber`} не найдена.
  - Расширен статус `450` ("Аутентификация завершена неудачей из-за неверного токена") дополнительной причиной: "Неправильный авторизационный вызов".

- **Получение токенов доступа** (POST `/auth/token/redeem`)  
  Дополнена документация HTTP 400 (Bad Request) кодами ошибок:
    - `21301` - "Отсутствие авторизации":
      - Токены для операции {`referenceNumber`} уже получены,
      - Статус аутентификации ({`operation.Status`}) не позволяет получить токены,
      - Токен KSeF был аннулирован.
    - `21304` - "Отсутствие аутентификации" - Операция аутентификации {`referenceNumber`} не найдена, 
    - `21308` - "Попытка использования авторизационных методов умершего лица".

- **Обновление токена доступа** (POST `/auth/token/refresh`)  
  Дополнена документация HTTP 400 (Bad Request) кодами ошибок:
    - `21301` - "Отсутствие авторизации":
      - Статус аутентификации ({`operation.Status`}) не позволяет получить токены,
      - Токен KSeF был аннулирован.
    - `21304` - "Отсутствие аутентификации" - Операция аутентификации {`referenceNumber`} не найдена, 
    - `21308` - "Попытка использования авторизационных методов умершего лица".

- **Интерактивная отправка** (POST `/sessions/online/{referenceNumber}/invoices`)  
  Дополнена документация кодов ошибок:
    - `21402` "Неправильный размер файла" - длина содержимого не соответствует размеру файла, 
    - `21403` "Неправильный хеш файла" - хеш содержимого не соответствует хешу файла.

- **Экспорт пакета счетов (POST `/invoices/exports`). Получение списка метаданных счетов (POST `/invoices/query/metadata`)**  
  Уменьшен максимальный допустимый диапазон `dateRange` с 2 лет до 3 месяцев.

- **Разрешения**  
  - Добавлен атрибут `required` для свойства `subjectDetails` ("Данные субъекта, которому предоставляются разрешения") во всех endpoints, предоставляющих разрешения (`/permissions/.../grants).
  - Добавлен атрибут `required` для свойства `euEntityDetails` ("Данные субъекта ЕС, в контексте которого предоставляются разрешения") в endpoint POST `/permissions/eu-entities/administration/grants` ("Предоставление разрешений администратора субъекта ЕС").  
  - Добавлено значение `PersonByFingerprintWithIdentifier` ("Физическое лицо, использующее сертификат, не содержащий идентификатор NIP или PESEL, но имеющее NIP или PESEL") к enum `EuEntityPermissionSubjectDetailsType` в endpoint POST `/permissions/eu-entities/administration/grants` ("Предоставление разрешений администратора субъекта ЕС").    
  - Изменен тип свойства `subjectEntityDetails` на `PermissionsSubjectEntityByIdentifierDetails` ("Данные уполномоченного субъекта") в модели ответа в POST `/permissions/query/authorizations/grants` ("Получение списка субъектных разрешений на обработку счетов").  
  - Изменен тип свойства `subjectEntityDetails` на `PermissionsSubjectEntityByFingerprintDetails` ("Данные уполномоченного субъекта") в модели ответа в POST `/permissions/query/eu-entities/grants` ("Получение списка разрешений администраторов или представителей субъектов ЕС, уполномоченных на самовыставление").  
  - Изменен тип свойства `subjectPersonDetails` на `PermissionsSubjectPersonByFingerprintDetails` ("Данные уполномоченного лица") в модели ответа в POST `/permissions/query/eu-entities/grants` ("Получение списка разрешений администраторов или представителей субъектов ЕС, уполномоченных на самовыставление").    
  - Введена валидация контрольной суммы для идентификатора `InternalId` в POST `/permissions/subunits/grants` ("Предоставление разрешений администратора подчиненного субъекта").
  - Уточнены описания свойств.

- **OpenAPI**  
  - Дополнена документация ответа `429` возвращаемым заголовком `Retry-After` и содержанием ответа `TooManyRequestsResponse`.
  - Уточнены описания свойств типа `byte` - значения передаются как двоичные данные, закодированные в формате `Base64`.
  - Исправлены опечатки в спецификации.

### Версия 2.0.0 RC6.1

- **Новая адресация сред**  
  Предоставление новых адресов. Изменения в разделе [среды KSeF API 2.0](srodowiska.md).

- **Аутентификация - получение статуса (GET `/auth/{referenceNumber}`)**  
  Добавлен код `480` - Аутентификация заблокирована: "Подозрение на инцидент безопасности. Свяжитесь с Министерством финансов через форму обращения."

- **Разрешения**  
  - Расширены правила доступа для операций сессии (GET/POST `/sessions/...`): в список принимаемых разрешений добавлено `EnforcementOperations` (исполнительный орган).
  - Добавлены ограничения длины для свойств типа string: `minLength` и `maxLength`.
  - Добавлен `id` (`Asc`) как второй ключ сортировки в метаданных `x-sort` для запросов поиска разрешений. Порядок по умолчанию: `dateCreated` (`Desc`), затем `id` (`Asc`) - порядковое изменение, повышающее детерминированность пагинации.
  - Добавлена валидация свойства `IdDocument.country` в endpoint POST `/permissions/persons/grants` ("Предоставление физическим лицам разрешений на работу в KSeF") - требуется соответствие **ISO 3166-1 alpha-2** (например, `PL`, `DE`, `US`).
  - "Получение списка разрешений администраторов или представителей субъектов ЕС, уполномоченных на самовыставление" (POST `/permissions/query/eu-entities/grants`):
    - удалена валидация pattern (regex) и уточнено описание свойства `EuEntityPermissionsQueryRequest.authorizedFingerprintIdentifier`.
    - уточнено описание свойства `EuEntityPermissionsQueryRequest.vatUeIdentifier`.

- **Интерактивная сессия**  
  Добавлены новые коды ошибок для POST `/sessions/online/{referenceNumber}/invoices` ("Отправка счета"):
    - `21166` - Техническая коррекция недоступна.
    - `21167` - Статус счета не позволяет техническую коррекцию.

- **Лимиты API**  
  - Увеличен часовой лимит для группы `invoiceStatus` (получение статуса счета из сессии) с 720 до 1200 req/h: 
    - GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}.
  - Увеличен часовой лимит для группы `sessionMisc` (ресурсы GET `/sessions/*`) с 720 до 1200 req/h:
    - GET `/sessions/{referenceNumber}`, 
    - GET `/sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`,
    - GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`,
    - GET `/sessions/{referenceNumber}/upo/{upoReferenceNumber}`.
  - Уменьшен часовой лимит для группы `batchSession` (открытие/закрытие пакетной сессии) с 120 до 60 req/h: 
    - POST `/sessions/batch`, 
    - POST `/sessions/batch/{referenceNumber}/close`.
  - Увеличены лимиты для endpoint `/invoices/exports/{referenceNumber}` ("Получение статуса экспорта пакета счетов") путем добавления новой группы `invoiceExportStatus` с параметрами: 10 req/s, 60 req/min, 600 req/h. 

- **Открытие пакетной сессии (POST `/sessions/batch`)**  
  Удалено из модели `BatchFilePartInfo` свойство `fileName` (ранее помеченное как deprecated; x-removal-date: 2025-12-07).  

- **Инициализация аутентификации (POST `/auth/challenge`)**  
  Добавлено свойство `timestampMs` (int64) в модели ответа - время генерации challenge в миллисекундах с 1.01.1970 (Unix).

- **Тестовые данные**
  - Уточнен тип свойства `expectedEndDate`: format: `date` в (POST `/testdata/attachment/revoke`).
  - Удалено значение `Token` из enum `SubjectIdentifierType` в endpoint POST `/testdata/limits/subject/certificate`. Значение не использовалось: в KSeF субъект не может быть "токеном" - идентичность всегда происходит от `NIP/PESEL` или отпечатка сертификата, который несет идентичность субъекта, который его создал.

- **OpenAPI**  
  Увеличено максимальное значение `pageSize` с 500 до 1000 для endpoints:
  - GET `/sessions`
  - GET `/sessions/{referenceNumber}/invoices`
  - GET `/sessions/{referenceNumber}/invoices/failed`

### Версия 2.0.0 RC6.0

- **Лимиты API**  
  - На среде **TE** (тестовая) включена и определена политика [лимитов api](limity/limity-api.md) со значениями в 10 раз выше, чем на **PRD**; подробности: ["Лимиты на средах"](/limity/limity-api.md#limity-na-środowiskach).
  - На среде **TR** (DEMO) включены [лимиты api](limity/limity-api.md) со значениями, идентичными **PRD**. Значения реплицируются с продакшна; подробности: ["Лимиты на средах"](/limity/limity-api.md#limity-na-środowiskach).
  - Добавлен endpoint POST `/testdata/rate-limits/production` - устанавливает в текущем контексте значения лимитов api согласно производственному профилю. Доступен только на среде **TE**.
  
- **Экспорт пакета счетов (POST `/invoices/exports`). Получение списка метаданных счетов (POST `/invoices/query/metadata`)**   
  - Добавлен документ [High Water Mark (HWM)](pobieranie-faktur/hwm.md), описывающий механизм управления полнотой данных во времени.
  - Обновлен [Инкрементальное получение счетов](pobieranie-faktur/przyrostowe-pobieranie-faktur.md) рекомендациями по использованию механизма `HWM`.
  - Расширена модель ответа свойством `permanentStorageHwmDate` (string, date-time, nullable). Касается исключительно запросов с `dateType = PermanentStorage` и означает точку, ниже которой данные полные; для `dateType = Issue/Invoicing` - null.  
  - Добавлено свойство `restrictToPermanentStorageHwmDate` (boolean, nullable) в объекте `dateRange`, которое включает механизм High Water Mark (`HWM`) и ограничивает диапазон дат до текущего значения `HWM`. Касается исключительно запросов с `dateType = PermanentStorage`. Применение параметра значительно снижает дубликаты между последовательными экспортами и обеспечивает согласованность во время длительной инкрементальной синхронизации.

- **UPO - обновление XSD до v4-3**
  - Изменен паттерн (`pattern`) элемента `NumerKSeFDokumentu`, чтобы допускать также номера KSeF, генерируемые для счетов из KSeF 1.0 (36 символов).
  - Добавлен элемент `TrybWysylki` - режим отправки документа в KSeF: `Online` или `Offline`.
  - Изменено значение `NazwaStrukturyLogicznej` на формат: Schemat_{systemCode}_v{schemaVersion}.xsd (например, Schemat_FA(3)_v1-0E.xsd).
  - Изменено значение `NazwaPodmiotuPrzyjmujacego` на тестовых средах путем добавления суффикса с названием среды:
    - `TE`: Ministerstwo Finansów - środowisko testowe (TE),
    - `TR`: Ministerstwo Finansów - środowisko przedprodukcyjne (TR).
    
    `PRD`: без изменений - Ministerstwo Finansów.  
  - В настоящее время по умолчанию возвращается UPO v4-2. Чтобы получить UPO v4-3, необходимо добавить заголовок: `X-KSeF-Feature: upo-v4-3` при открытии сессии (online/пакетной).
  - С `2025-12-22` версией по умолчанию будет UPO v4-3.
  - XSD UPO v4-3: [schema](/faktury/upo/schemy/upo-v4-3.xsd).

- **Статус сессии** (GET `/sessions/{referenceNumber}`)  
    Уточнено описание кода `440` - Сессия отменена: возможные причины - "Превышено время отправки" или "Счета не переданы".    

- **Статус счета** (GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}`)  
    Добавлен тип `InvoiceStatusInfo` (расширяет `StatusInfo`) с полем `extensions` - объектом со структурированными деталями статуса. Поле `details` остается без изменений. Пример (дубликат счета):
    
    ```json
    "status": {
      "code": 440,
      "description": "Duplikat faktury",
      "details": [
        "Duplikat faktury. Faktura o numerze KSeF: 5265877635-20250626-010080DD2B5E-26 została już prawidłowo przesłana do systemu w sesji: 20250626-SO-2F14610000-242991F8C9-B4"
      ],
      "extensions": {
        "originalSessionReferenceNumber": "20250626-SO-2F14610000-242991F8C9-B4",
        "originalKsefNumber": "5265877635-20250626-010080DD2B5E-26"
      }
    }    
    ```

- **Разрешения**  
    Добавлено свойство `subjectDetails` - "Данные субъекта, которому предоставляются разрешения" ко всем endpoints, предоставляющим разрешения (/permissions/.../grants). В RC6.0 поле опционально; с 2025-12-19 будет обязательным.  

- **Поиск предоставленных разрешений** (POST `/permissions/query/authorizations/grants`)  
    Расширены правила доступа о `PefInvoiceWrite`.

- **Тестовые данные - вложения (POST /testdata/attachment/revoke)**  
  Расширена модель запроса `AttachmentPermissionRevokeRequest` полем `expectedEndDate` (опционально) - дата отзыва согласия на отправку счетов с вложением.    

- **OpenAPI**  
  - Добавлен ответ HTTP `429` - "Too Many Requests" ко всем endpoints. В свойстве `description` этого ответа публикуется табличное представление лимитов (`req/s`, `req/min`, `req/h`) и названия группы лимитов, назначенной endpoint. Механизм и семантика `429` остаются совместимыми с описанием в документации [лимитов](/limity/limity-api.md).
  - К каждому endpoint добавлены метаданные `x-rate-limits` со значениями лимитов (`req/s`, `req/min`, `req/h`).
  - Удалены явные свойства `exclusiveMaximum`: `false` и `exclusiveMinimum`: `false` из числовых определений (оставлены только minimum/maximum). Упорядочивающее изменение – без влияния на валидацию (в OpenAPI значения по умолчанию этих свойств равны `false`).
  - Добавлены ограничения длины для свойств типа string: `minLength`.
  - Удалены явные настройки `style`: `form` для параметров в in: query.
  - Изменен порядок значений enum `BuyerIdentifierType` (сейчас: `None`, `Other`, `Nip`, `VatUe`). Упорядочивающее изменение - без влияния на работу.
  - Исправлена опечатка в описании свойства `KsefNumber`.
  - Уточнен формат свойства `PublicKeyCertificate`, представляющего двоичные данные, закодированные в `Base64`, установлен format: `byte`.
  - Внесены мелкие языковые и пунктуационные коррекции в поля `description`.

### Версия 2.0.0 RC5.7

- **Открытие пакетной сессии (POST `/sessions/batch`)**  
  Помечено в модели запроса `BatchFilePartInfo.fileName` как `deprecated` (планируемое удаление: 2025-12-05).

- **Статусы асинхронных операций**  
  Добавлен статус `550` - "Операция была отменена системой". Описание: "Обработка была прервана по внутренним причинам системы. Попробуйте снова."

- **OpenAPI**  
  - Добавлены ограничения количества элементов в массиве: `minItems`, `maxItems`.
  - Добавлены ограничения длины для свойств типа string: `minLength` и `maxLength`.  
  - Обновлены описания свойств (`invoiceMetadataAuthorizedSubject.role`, `invoiceMetadataBuyer`, `invoiceMetadataThirdSubject.role`, `buyerIdentifier`).
  - Обновлены regex patterns для `vatUeIdentifier`, `authorizedFingerprintIdentifier`, `internalId`, `nipVatUe`, `peppolId`.

### Версия 2.0.0 RC5.6

- **Получение статуса сессии (GET `/sessions/{referenceNumber}`)**  
  Добавлено в ответе поле `UpoPageResponse.downloadUrlExpirationDate` - дата и время истечения адреса получения UPO; после этого момента `downloadUrl` больше не активен.

- **Получение списка метаданных сертификатов (POST `/certificates/query`)**  
  Расширен ответ (`CertificateListItem`) свойством `requestDate` - дата подачи заявления на сертификацию.  

- **Получение списка поставщиков услуг Peppol (GET `/peppol/query`)**  
  - Расширена модель ответа полем `dateCreated` - дата регистрации поставщика услуг Peppol в системе.
  - Помечены свойства `dateCreated`, `id`, `name` в модели ответа как всегда возвращаемые.
  - Определена схема `PeppolI` (string, 9 символов) и применена в `PeppolProvider`.

- **OpenAPI**  
  - Добавлены метаданные `x-sort` ко всем endpoints, возвращающим списки. В описаниях endpoints добавлен раздел Сортировка с порядком по умолчанию (например, "requestDate (Desc)").
  - Добавлены ограничения длины для свойств типа string: `minLength` и `maxLength`.
  - Уточнен формат свойств, представляющих двоичные данные, закодированные в `Base64`: установлен format: `byte` (`encryptedInvoiceContent`, `encryptedSymmetricKey`, `initializationVector`, `encryptedToken`).
  - Определена общая схема `Sha256HashBase64` и применена ко всем свойствам, представляющим хеш `SHA-256` в `Base64` (включая `invoiceHash`).
  - Определена общая схема `ReferenceNumber` (string, длина 36) и применена ко всем параметрам и свойствам, представляющим номер операции асинхронной операции (в путях, запросах и ответах).
  - Определена общая схема `Nip` (string, 10 символов, regex pattern) и применена ко всем свойствам, представляющим NIP.
  - Определена схема `Pesel` (string, 11 символов, regex pattern) и применена в свойстве, представляющем PESEL.
  - Определена общая схема `KsefNumber` (string, 35-36 символов, regex pattern) и применена ко всем свойствам, представляющим номер KSeF.  
  - Определена схема `Challenge` (string, 36 символов) и применена в `AuthenticationChallengeResponse`.`challenge`.
  - Определена общая схема `PermissionId` (string, 36 символов) и применена во всех местах: в параметрах и в свойствах ответов.
  - Добавлены регулярные выражения для выбранных текстовых полей.

### Версия 2.0.0 RC5.5

- **Получение текущих лимитов API (GET `/api/v2/rate-limits`)**  
  Добавлен endpoint, возвращающий эффективные лимиты вызовов API в структуре `perSecond`/`perMinute`/`perHour` для отдельных областей (включая `onlineSession`, `batchSession`, `invoiceSend`, `invoiceStatus`, `invoiceExport`, `invoiceDownload`, `other`).

- **Статус счета в сессии**  
  Расширен ответ для GET `/sessions/{referenceNumber}/invoices` ("Получение счетов сессии") и GET `/sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}` ("Получение статуса счета из сессии") свойствами: `upoDownloadUrlExpirationDate` - "дата и время истечения адреса. После этой даты ссылка `UpoDownloadUrl` не будет активна". Расширено описание `upoDownloadUrl`.

- **Удаление полей \*InMib (изменение согласно анонсу из 5.3)**  
  Удалены свойства `maxInvoiceSizeInMib` и `maxInvoiceWithAttachmentSizeInMib`.
  Изменение касается:
    - GET `/limits/context` – ответов (`onlineSession`, `batchSession`),
    - POST `/testdata/limits/context/session` – модели запроса (`onlineSession`, `batchSession`),
    - Моделей: `BatchSessionContextLimitsOverride`, `BatchSessionEffectiveContextLimits`, `OnlineSessionContextLimitsOverride`, `OnlineSessionEffectiveContextLimits`.
  Для указания размеров используются исключительно поля *InMB (1 MB = 1 000 000 B).

- **Удаление `operationReferenceNumber` (изменение согласно анонсу из 5.3)**  
  Удалено свойство `operationReferenceNumber` из модели ответа; единственным обязательным названием является `referenceNumber`. Изменение включает:
  - GET `/invoices/exports/{referenceNumber}` - "Статус экспорта пакета счетов",
  - POST `/permissions/operations/{referenceNumber}` - "Получение статуса операции разрешений".

- **Экспорт пакета счетов (POST `/invoices/exports`)**  
  - Добавлен новый код ошибки: `21182` - "Достигнут лимит выполняющихся экспортов. Для аутентифицированного субъекта в текущем контексте достигнут максимальный лимит {count} одновременных экспортов счетов. Попробуйте позже".
  - Расширена модель ответа свойством `packageExpirationDate`, указывающим дату истечения подготовленного пакета. После истечения этой даты пакет не будет доступен для загрузки.
  - Добавлен код ошибки `210` - "Экспорт счетов истек и больше не доступен для загрузки".

- **Статус экспорта пакета счетов (GET `/invoices/exports/{referenceNumber}`)**  
  Уточнены описания полей ссылок на загрузку частей пакета:
  - `url` - "URL-адрес, на который необходимо отправить запрос загрузки части пакета. Ссылка генерируется динамически в момент запроса статуса операции экспорта. Не подлежит лимитам API и не требует передачи токена доступа при загрузке".
  - `expirationDate` - "Дата и время истечения ссылки, позволяющей загрузить часть пакета. После истечения этого момента ссылка перестает быть активной".

- **Авторизация**
  - Расширены правила доступа о `SubunitManage` для POST `/permissions/query/persons/grants`: операцию можно выполнить, если субъект имеет `CredentialsManage`, `CredentialsRead`, `SubunitManage`.
  - Предоставление разрешений косвенным способом (POST `/permissions/indirect/grants`)
    Обновлено описание свойства `targetIdentifier.description`: уточнено, что отсутствие идентификатора контекста означает предоставление косвенного разрешения общего типа.

- **OpenAPI**  
  Увеличено максимальное значение `pageSize` с 100 до 500 для endpoints:
  - GET `/sessions`
  - GET `/sessions/{referenceNumber}/invoices`
  - GET `/sessions/{referenceNumber}/invoices/failed`

### Версия 2.0.0 RC5.4

- **Получение списка метаданных счетов (POST /invoices/query/metadata)**  
  - Добавлен параметр `sortOrder`, позволяющий определить направление сортировки результатов.

- **Статус сессии**  
  Устранена ошибка, препятствующая заполнению этого свойства в ответах API, касающихся счетов (поле ранее не возвращалось). Значение заполняется асинхронно в момент постоянного сохранения и может быть временно null.

- **Тестовые данные (только на тестовых средах)**
  - Изменение лимитов API для текущего контекста (POST `testdata/rate-limits`)  
  Добавлен endpoint, позволяющий временно переопределить эффективные лимиты API для текущего контекста. Изменение подготавливает запуск симулятора лимитов на среде TE.
  - Восстановление лимитов по умолчанию (DELETE `/testdata/rate-limits`)
  Добавлен endpoint, восстанавливающий значения лимитов по умолчанию для текущего контекста.

- **OpenAPI**  
  - Уточнены определения массивов параметров в query; применен `style: form`. Множественные значения следует передавать через повтор параметра, например `?statuses=InProgress&statuses=Succeeded`. Документационное изменение, без влияния на работу API.
  - Обновлены описания свойств (`partUploadRequests`, `encryptedSymmetricKey`, `initializationVector`).

### Версия 2.0.0 RC5.3

- **Экспорт пакета счетов (POST `/invoices/exports`)**  
  Добавлена возможность включения файла `_metadata.json` в пакет экспорта. Файл имеет форму объекта JSON с массивом `invoices`, содержащим объекты `InvoiceMetadata` (модель, возвращаемая POST `/invoices/query/metadata`).
  Включение (preview): в заголовок запроса нужно добавить `X-KSeF-Feature`: `include-metadata`.
  С 2025-10-27 изменяется поведение endpoint по умолчанию - пакет экспорта всегда будет содержать файл `_metadata.json` (заголовок не потребуется).

- **Статус счета**  
  - В случае обработки с ошибкой, когда было возможно прочитать номер счета (например, код ошибки `440` - дубликат счета), ответ содержит свойство `invoiceNumber` с прочитанным номером.
  - Помечены свойства `invoiceHash`, `referenceNumber` в модели ответа как всегда возвращаемые.

- **Стандартизация единиц размера (MB, SI)**  
  Унифицирована запись лимитов в документации и API: значения представлены в MB (SI), где 1 MB = 1 000 000 B.

- **Получение лимитов для текущего контекста (GET `/limits/context`)**  
  Добавлены в модели ответа `maxInvoiceSizeInMB`, `maxInvoiceWithAttachmentSizeInMB` для свойств `onlineSession` и `batchSession`.
  Свойства `maxInvoiceSizeInMib`, `maxInvoiceWithAttachmentSizeInMib` помечены как deprecated (планируемое удаление: 2025-10-27).

- **Изменение лимитов сессии для текущего контекста (POST `/testdata/limits/context/session`)**  
  Добавлены в модели запроса `maxInvoiceSizeInMB`, `maxInvoiceWithAttachmentSizeInMB` для свойств `onlineSession` и `batchSession`.
  Свойства `maxInvoiceSizeInMib`, `maxInvoiceWithAttachmentSizeInMib` помечены как deprecated (планируемое удаление: 2025-10-27).

- **Статус экспорта пакета счетов (GET `/invoices/exports/{referenceNumber}`)**  
  Изменение названия параметра пути с `operationReferenceNumber` на `referenceNumber`.  
  Изменение не влияет на HTTP контракт (путь и значение без изменений) и поведение endpoint.

- **Разрешения**  
  - Обновлены описания endpoints и примеры endpoints из области permissions/*. Изменение касается исключительно документации (уточнение описаний, форматов и примеров); отсутствуют изменения в поведении API и контракте.
  - Изменение названия параметра пути с `operationReferenceNumber` на `referenceNumber` в "Получение статуса операции" (POST `/permissions/operations/{referenceNumber}`).  
  Изменение не влияет на HTTP контракт (путь и значение без изменений) и поведение endpoint.
  - "Предоставление разрешений косвенным способом" (POST `permissions/indirect/grants`)  
    Добавлена поддержка внутреннего идентификатора - расширено свойство `targetIdentifier` значением `InternalId`.
  - "Получение списка собственных разрешений" (POST `/permissions/query/personal/grants`)  
      - Расширено в модели запроса свойство `targetIdentifier` значением `InternalId` (возможность указания внутреннего идентификатора).
      - Удалено в модели ответа значение `PersonalPermissionScope.Owner`. Владельческие разрешения (предоставляемые через ZAW-FA или привязка NIP/PESEL) не возвращаются.

- **Статус аутентификации (GET `/auth/{referenceNumber}`)**  
  Расширена таблица кодов ошибок о `470` - "Аутентификация завершена неудачей" с уточнением: "Попытка использования авторизационных методов умершего лица".

- **Обработка счетов PEF**  
  Изменены значения enum (`FormCode`):
    - `FA_PEF (3)` на `PEF (3)`,
    - `FA_KOR_PEF (3)` на `PEF_KOR (3)`.

- **Генерация нового токена (POST `/tokens`)**  
  - В модели запроса (`GenerateTokenRequest`) помечены поля `description` и `permissions` как обязательные.
  - В модели ответа (`GenerateTokenResponse`) помечены поля `referenceNumber` и `token` как всегда возвращаемые.

- **Статус токена KSeF (GET /tokens/{referenceNumber})**
  - Помечены свойства `authorIdentifier`, `contextIdentifier`, `dateCreated`, `description`, `referenceNumber`, `requestedPermissions`, `status` в модели ответа как всегда возвращаемые.

- **Получение списка сгенерированных токенов (GET /tokens)**
  - Помечены свойства `authorIdentifier`, `contextIdentifier`, `dateCreated`, `description`, `referenceNumber`, `requestedPermissions`, `status` в модели ответа как всегда возвращаемые.

- **Тестовые данные - создание физического лица (POST `/testdata/person`)**  
  Расширен запрос свойством `isDeceased` (boolean), позволяя создать тестовое умершее лицо (например, для сценариев проверки кода статуса `470`).

- **OpenAPI**
  - Уточнены ограничения для свойств типа integer в requests путем добавления атрибутов `minimum` / `exclusiveMinimum`, `maximum` / `exclusiveMaximum`.  
  - Расширен ответ полем `referenceNumber` (содержит то же значение, что и прежнее `operationReferenceNumber`). Помечено `operationReferenceNumber` как `deprecated` и будет удалено из ответа 2025-10-27; следует перейти на `referenceNumber`. Характер изменения: переходное переименование с сохранением совместимости (оба свойства возвращаются параллельно до даты удаления).  
  Касается endpoints:
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
  - Удален атрибут `required` из свойства `pageSize` в запросе GET `/sessions` ("Получение списка сессий").
  - Обновлены примеры (example) в определениях endpoints.

### Версия 2.0.0 RC5.2
- **Разрешения** 
  - "Предоставление разрешений администратора подчиненного субъекта" (POST `/permissions/subunits/grants`)  
  Добавлено свойство `subunitName` ("Название подчиненного подразделения") в запросе. Поле обязательно, когда подчиненное подразделение идентифицируется внутренним идентификатором.
  - "Получение списка разрешений администраторов подразделений и подчиненных субъектов" (POST `/permissions/query/subunits/grants`)  
  Добавлено в ответе свойство `subunitName` ("Название подчиненного подразделения").
  - "Получение списка разрешений на работу в KSeF, предоставленных физическим лицам или субъектам" (POST `permissions/query/persons/grants`)  
    Удалено из результатов разрешение типа `Owner`. Разрешение `Owner` присваивается системно физическому лицу и не подлежит предоставлению, поэтому не должно появляться в списке предоставленных разрешений.
  - "Получение списка собственных разрешений" (POST `/permissions/query/personal/grants`)  
    Расширен enum фильтра `PersonalPermissionType` значением `VatUeManage`.

- **Лимиты**  
  - Добавлены endpoints для проверки установленных лимитов (контекст, аутентифицированный субъект):
    - GET `/limits/context`
    - GET `/limits/subject`
  - Добавлены endpoints для управления лимитами (контекст, аутентифицированный субъект) в тестовой среде:
    - POST/DELETE `/testdata/limits/context/session`
    - POST/DELETE `/testdata/limits/subject/certificate`
  - Обновлены [Лимиты](limity/limity.md).

- **Статус счета**  
  Добавлено свойство `invoicingMode` в модели ответа. Обновлена документация: [Автоматическое определение режима отправки offline](offline/automatyczne-okreslanie-trybu-offline.md).

- **OpenAPI**
  - Уточнены ограничения для свойств типа integer в requests путем добавления атрибутов `minimum` / `exclusiveMinimum`, `maximum` / `exclusiveMaximum` и значений по умолчанию `default`.
  - Обновлены примеры (example) в определениях endpoints.
  - Уточнены описания endpoints.
  - Добавлен атрибут `required` для обязательных свойств в запросах и ответах.

### Версия 2.0.0 RC5.1

- **Получение списка метаданных сертификатов (POST /certificates/query)**  
  Изменено представление идентификатора субъекта с пары свойств `subjectIdentifier` + `subjectIdentifierType` на составной объект `subjectIdentifier` { `type`, `value` }.

- **Получение списка метаданных счетов (POST /invoices/query/metadata)**
  - Изменено представление выбранных идентификаторов с пар свойств тип + value на составные объекты { type, value }: 
    - `invoiceMetadataBuyer.identifier` + `invoiceMetadataBuyer.identifierType` на составной объект `invoiceMetadataBuyerIdentifier` { `type`, `value` },
    - `invoiceMetadataThirdSubject.identifier` + `invoiceMetadataThirdSubject.identifierType` на составной объект `InvoiceMetadataThirdSubjectIdentifier` { `type`, `value` }.
  - Удалены `obsoleted` свойства `Identitifer` из объектов `InvoiceMetadataSeller` и `InvoiceMetadataAuthorizedSubject`.
  - Изменено свойство `invoiceQuerySeller` на `sellerNip` в фильтре запроса.
  - Изменено свойство `invoiceQueryBuyer` на `invoiceQueryBuyerIdentifier` со свойствами { `type`, `value` } в фильтре запроса.

- **Разрешения**  
  Изменено представление выбранных идентификаторов с пар свойств тип + value на составные объекты { type, value }: 
    - "Получение списка собственных разрешений" (POST `/permissions/query/personal/grants`):  
      - `contextIdentifier` + `contextIdentifierType` -> `contextIdentifier` { `type`, `value` },
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `targetIdentifier` + `targetIdentifierType` -> `targetIdentifier` { type, value }.  
    - "Получение списка разрешений на работу в KSeF, предоставленных физическим лицам или субъектам" (POST `/permissions/query/persons/grants`),
      - `contextIdentifier` + `contextIdentifierType` -> `contextIdentifier` { `type`, `value` },
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `targetIdentifier` + `targetIdentifierType` -> `targetIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }.    
    - "Получение списка разрешений администраторов подразделений и подчиненных субъектов" (POST `/permissions/query/subunits/grants`):
      - `authorizedIdentifier` + `authorizedIdentifierType` -> `authorizedIdentifier` { `type`, `value` },
      - `subunitIdentifier` + `subunitIdentifierType` -> `subunitIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }.
    - "Получение списка ролей субъекта" (POST `/permissions/query/entities/roles`):
      - `parentEntityIdentifier` + `parentEntityIdentifierType` -> `parentEntityIdentifier` { `type`, `value` }.
    - "Получение списка подчиненных субъектов" (POST `/permissions/query/subordinate-entities/roles`):
      - `subordinateEntityIdentifier` + `subordinateEntityIdentifierType` -> `subordinateEntityIdentifier` { `type`, `value` }.
    - "Получение списка субъектных разрешений на обработку счетов" (POST `/permissions/query/authorizations/grants`):
      - `authorizedEntityIdentifier` + `authorizedEntityIdentifierType` -> `authorizedEntityIdentifier` { `type`, `value` },
      - `authorizingEntityIdentifier` + `authorizingEntityIdentifierType` -> `authorizingEntityIdentifier` { `type`, `value` },
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }
    - "Получение списка разрешений администраторов или представителей субъектов ЕС, уполномоченных на самовыставление" (POST `/permissions/query/eu-entities/grants`):
      - `authorIdentifier` + `authorIdentifierType` -> `authorIdentifier` { `type`, `value` }        

- **Предоставление разрешений администратора субъекта ЕС (POST permissions/eu-entities/administration/grants)**  
  Изменено название свойства в запросе с `subjectName` на `euEntityName`.

- **Аутентификация с использованием токена KSeF**  
  Удалены избыточные значения enum `None`, `AllPartners` в свойстве `contextIdentifier.type` запроса POST `/auth/ksef-token`.

- **Токены KSeF**  
  - Унифицирована модель ответа GET `/tokens`: свойства `authorIdentifier.type`, `authorIdentifier.value`, `contextIdentifier.type`, `contextIdentifier.value` всегда возвращаются (required, non-nullable),
  - Удалены избыточные значения enum `None`, `AllPartners` в свойствах `authorIdentifier.type` и `contextIdentifier.type` в модели ответа GET `/tokens` ("Получение списка сгенерированных токенов").

- **Пакетная сессия**  
  Удален избыточный код ошибки `21401`	- "Документ не соответствует схеме (json)".

- **Получение статуса сессии (GET /sessions/{referenceNumber})**  
  - Добавлен код ошибки `420` - "Превышен лимит счетов в сессии".

- **Получение метаданных счетов (GET `/invoices/query/metadata`)**  
  - Добавлено в ответе (всегда возвращаемое) свойство `isTruncated` (boolean) – "Определяет, был ли результат обрезан из-за превышения лимита количества счетов (10 000)",
  - Помечено свойство `amount.type` в фильтре запроса как обязательное.

- **Экспорт пакета счетов: задание (POST `/invoices/exports`)**
  - Помечено свойство `operationReferenceNumber` в модели ответа как всегда возвращаемое,
  - Помечено свойство `amount.type` в фильтре запроса как обязательное.

- **Получение списка разрешений на работу в KSeF, предоставленных физическим лицам или субъектам (POST /permissions/query/persons/grants)**  
  - Добавлен `contextIdentifier` в фильтре запроса и в модели ответа.

- **OpenAPI**  
  Удален неиспользуемый `operationId` из спецификации. Упорядочивающее изменение.

### Версия 2.0.0 RC5

- **Обработка счетов PEF и поставщиков услуг Peppol**
  - Добавлена поддержка счетов `PEF`, отправляемых поставщиком услуг Peppol. Новые возможности не изменяют прежние поведения KSeF для других форматов, являются расширением API.
  - Введен новый тип контекста аутентификации: `PeppolId`, позволяющий работать в контексте поставщика услуг Peppol.
  - Автоматическая регистрация поставщика: при первой аутентификации поставщика услуг Peppol (с использованием выделенного сертификата) происходит его автоматическая регистрация в системе.
  - Добавлен endpoint GET `/peppol/query` ("Список поставщиков услуг Peppol"), возвращающий зарегистрированных поставщиков.
  - Обновлены правила доступа для открытия и закрытия сессии, отправка счетов требует разрешения `PefInvoiceWrite`.
  - Добавлены новые схемы счетов: `FA_PEF (3)`, `FA_KOR_PEF (3)`,
  - Расширен `ContextIdentifier` о `PeppolId` в xsd `AuthTokenRequest`.

- **UPO**
  - Добавлен элемент `Uwierzytelnienie`, который упорядочивает данные из заголовка UPO и расширяет их дополнительной информацией; заменяет прежние `IdentyfikatorPodatkowyPodmiotu` и `SkrotZlozonejStruktury`.
  - `Uwierzytelnienie` содержит:
    - `IdKontekstu` – идентификатор контекста аутентификации,
    - доказательство аутентификации (в зависимости от метода): 
      - `NumerReferencyjnyTokenaKSeF` - идентификатор токена аутентификации в системе KSeF,
      - `SkrotDokumentuUwierzytelniajacego` - значение функции хеша документа аутентификации в полученном системой виде (включая электронную подпись).
  - В элементе `Dokument` добавлены:
    - NipSprzedawcy,
    - DataWystawieniaFaktury,
    - DataNadaniaNumeruKSeF.
  - Унифицирована схема UPO. UPO для счета и для сессии используют общую схему upo-v4-2.xsd. Заменяет прежние upo-faktura-v3-0.xsd и upo-sesja-v4-1.
