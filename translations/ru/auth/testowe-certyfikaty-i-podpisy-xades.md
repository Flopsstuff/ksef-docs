---
original: auth/testowe-certyfikaty-i-podpisy-xades.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [auth/testowe-certyfikaty-i-podpisy-xades.md](https://github.com/CIRFMF/ksef-docs/blob/main/auth/testowe-certyfikaty-i-podpisy-xades.md)

# Тестовые сертификаты и подписи XAdES

Данное руководство показывает, как **быстро запустить** консольное демонстрационное приложение [`KSeF.Client.Tests.CertTestApp`](https://github.com/CIRFMF/ksef-client-csharp) для:
- генерации **тестового (self‑signed) сертификата** для нужд тестовой среды KSeF,
- создания и **подписи XAdES** документа `AuthTokenRequest`,
- отправки подписанного документа в KSeF и **получения токенов** доступа (JWT).

> **Внимание**
> - Самоподписанные сертификаты **разрешены исключительно** в **тестовой** среде.
> - Данные в примерах (NIP, справочный номер, токены) являются **вымышленными** и служат только для демонстрации.

---

## Предварительные требования
- **.NET 10 SDK**
- Git
- Windows или Linux

---

## Что делает приложение?
- Получает **challenge** (вызов) из KSeF.
- Создает XML-документ `AuthTokenRequest`.
- **Подписывает** документ `AuthTokenRequest` в формате **XAdES**.
- Отправляет подписанный документ в KSeF и получает `referenceNumber` + `authenticationToken`.
- **Опрашивает статус** операции аутентификации до получения результата.
- После успеха получает пару токенов: `accessToken` и `refreshToken` (JWT).
- Сохраняет артефакты (включая **тестовый сертификат** и **подписанный XML**) в файлы, если выбран вывод `file`.

---

## Windows

1. **Установите .NET 10 SDK**:
   ```powershell
   winget install Microsoft.DotNet.SDK.10
   ```
   Альтернативно: скачайте установщик с сайта .NET.

2. **Откройте новое окно терминала** (PowerShell/CMD).

3. **Проверьте установку**:
   ```powershell
   dotnet --version
   ```
   Ожидаемый номер версии: `10.x.x`.

4. **Клонируйте репозиторий и перейдите к проекту**:
   ```powershell
   git clone https://github.com/CIRFMF/ksef-client-csharp.git
   cd ksef-client-csharp/KSeF.Client.Tests.CertTestApp
   ```

5. **Запустите (по умолчанию случайный NIP, результат на экране)**:
   ```powershell
   dotnet run --framework net10.0
   ```

6. **Запуск с параметрами**:
   - `--output` – `screen` (по умолчанию) или `file` (запись результатов в файлы),
   - `--nip` {номер_nip} - например `--nip 8976111986`,
   - опционально: `--no-startup-warnings`.

   ```powershell
   dotnet run --framework net10.0 --output file --nip 8976111986 --no-startup-warnings
   ```

---

## Linux (Ubuntu/Debian)

1. **Добавьте репозиторий Microsoft и обновите пакеты**:
   ```bash
   wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb
   sudo apt-get update
   ```

2. **Установите .NET 10 SDK**:
   ```bash
   sudo apt-get install -y dotnet-sdk-10.0
   ```

3. **Обновите окружение оболочки или откройте новый терминал**:
   ```bash
   source ~/.bashrc
   ```

4. **Проверьте установку**:
   ```bash
   dotnet --version
   ```
   Ожидаемый номер версии: `10.x.x`.

5. **Клонируйте репозиторий и перейдите к проекту**:
   ```bash
   git clone https://github.com/CIRFMF/ksef-client-csharp.git
   cd ksef-client-csharp/KSeF.Client.Tests.CertTestApp
   ```

6. **Запустите (результат на экране, случайный NIP)**:
   ```bash
   dotnet run --framework net10.0
   ```

7. **Запуск с параметрами**:
   - `--output` – `screen` (по умолчанию) или `file` (запись результатов в файлы),
   - `--nip` {номер_nip} - например `--nip 8976111986`,
   - опционально: `--no-startup-warnings`.

   ```bash
   dotnet run --framework net10.0 --output file --nip 8976111986 --no-startup-warnings
   ```

---

Связанные документы: 
- [Аутентификация в KSeF](../uwierzytelnianie.md)
- [Подпись XAdES](podpis-xades.md)

---
