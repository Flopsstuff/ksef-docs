---
original: auth/testowe-certyfikaty-i-podpisy-xades.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [auth/testowe-certyfikaty-i-podpisy-xades.md](https://github.com/CIRFMF/ksef-docs/blob/main/auth/testowe-certyfikaty-i-podpisy-xades.md)

# Тестові сертифікати та підписи XAdES

Цей посібник показує, як **швидко запустити** консольний демонстраційний додаток [`KSeF.Client.Tests.CertTestApp`](https://github.com/CIRFMF/ksef-client-csharp) з метою:
- генерування **тестового (self‑signed) сертифіката** для потреб тестового середовища KSeF,
- побудови та **підписання XAdES** документу `AuthTokenRequest`,
- надсилання підписаного документу до KSeF та **отримання токенів** доступу (JWT).

> **Увага**
> - Самопідписані сертифікати **дозволені виключно** у **тестовому** середовищі.
> - Дані в прикладах (NIP, номер посилання, токени) є **фіктивними** і служать виключно для демонстрації.

---

## Попередні вимоги
- **.NET 10 SDK**
- Git
- Windows або Linux

---

## Що робить додаток?
- Отримує **challenge** (виклик) з KSeF.
- Будує XML документ `AuthTokenRequest`.
- **Підписує** документ `AuthTokenRequest` у форматі **XAdES**.
- Надсилає підписаний документ до KSeF і отримує `referenceNumber` + `authenticationToken`.
- **Запитує статус** операції автентифікації до успіху.
- Після успіху отримує пару токенів: `accessToken` і `refreshToken` (JWT).
- Записує артефакти (зокрема **тестовий сертифікат** та **підписаний XML**) до файлів, якщо вибрано вивід `file`.

---

## Windows

1. **Встановіть .NET 10 SDK**:
   ```powershell
   winget install Microsoft.DotNet.SDK.10
   ```
   Альтернативно: завантажте інсталятор з веб-сайту .NET.

2. **Відкрийте нове вікно терміналу** (PowerShell/CMD).

3. **Перевірте встановлення**:
   ```powershell
   dotnet --version
   ```
   Очікуваний номер версії: `10.x.x`.

4. **Клонуйте репозиторій і перейдіть до проєкту**:
   ```powershell
   git clone https://github.com/CIRFMF/ksef-client-csharp.git
   cd ksef-client-csharp/KSeF.Client.Tests.CertTestApp
   ```

5. **Запустіть (за замовчуванням випадковий NIP, результат на екран)**:
   ```powershell
   dotnet run --framework net10.0
   ```

6. **Запуск з параметрами**:
   - `--output` – `screen` (за замовчуванням) або `file` (запис результатів до файлів),
   - `--nip` {номер_nip} - наприклад `--nip 8976111986`,
   - опціонально: `--no-startup-warnings`.

   ```powershell
   dotnet run --framework net10.0 --output file --nip 8976111986 --no-startup-warnings
   ```

---

## Linux (Ubuntu/Debian)

1. **Додайте репозиторій Microsoft і оновіть пакети**:
   ```bash
   wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb
   sudo apt-get update
   ```

2. **Встановіть .NET 10 SDK**:
   ```bash
   sudo apt-get install -y dotnet-sdk-10.0
   ```

3. **Оновіть середовище оболонки або відкрийте новий термінал**:
   ```bash
   source ~/.bashrc
   ```

4. **Перевірте встановлення**:
   ```bash
   dotnet --version
   ```
   Очікуваний номер версії: `10.x.x`.

5. **Клонуйте репозиторій і перейдіть до проєкту**:
   ```bash
   git clone https://github.com/CIRFMF/ksef-client-csharp.git
   cd ksef-client-csharp/KSeF.Client.Tests.CertTestApp
   ```

6. **Запустіть (результат на екран, випадковий NIP)**:
   ```bash
   dotnet run --framework net10.0
   ```

7. **Запуск з параметрами**:
   - `--output` – `screen` (за замовчуванням) або `file` (запис результатів до файлів),
   - `--nip` {номер_nip} - наприклад `--nip 8976111986`,
   - опціонально: `--no-startup-warnings`.

   ```bash
   dotnet run --framework net10.0 --output file --nip 8976111986 --no-startup-warnings
   ```

---

Пов'язані документи: 
- [Автентифікація в KSeF](../uwierzytelnianie.md)
- [Підпис XAdES](podpis-xades.md)

---
