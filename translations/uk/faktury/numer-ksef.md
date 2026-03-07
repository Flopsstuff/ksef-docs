---
original: faktury/numer-ksef.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [faktury/numer-ksef.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/numer-ksef.md)

# Номер KSeF – структура та валідація

Номер KSeF це унікальний ідентифікатор рахунку, що надається системою. Завжди має довжину **35 символів** і є глобально унікальним – однозначно ідентифікує кожен рахунок у KSeF.

## Загальна структура номера 
```
9999999999-RRRRMMDD-FFFFFFFFFFFF-FF  
```
Де:
- `9999999999` – NIP продавця (10 цифр),
- `RRRRMMDD` – дата прийняття рахунка (рік, місяць, день) до подальшої обробки,
- `FFFFFFFFFFFF` – технічна частина, що складається з 12 символів у шістнадцятковому записі, тільки [0–9 A–F], великі літери,
- `FF` – контрольна сума CRC-8 - 2 символи у шістнадцятковому записі, тільки [0–9 A–F], великі літери.

## Приклад
```
5265877635-20250826-0100001AF629-AF
```
- `5265877635` - NIP продавця,
- `20250826` - дата прийняття рахунка до подальшої обробки,
- `0100001AF629` - технічна частина,
- `AF` - контрольна сума CRC-8.

## Валідація номера KSeF

Процес валідації включає:
1. Перевірку, чи має номер **точно 35 символів**.  
2. Розділення частини даних (32 символи) та контрольної суми (2 символи).  
3. Обчислення контрольної суми з частини даних **алгоритмом CRC-8**.  
4. Порівняння обчисленої суми зі значенням, що знаходиться в номері.

## Алгоритм CRC-8

Для обчислення контрольної суми застосовується алгоритм **CRC-8** з параметрами:

- **Поліном:** `0x07`  
- **Початкове значення:** `0x00`  
- **Формат результату:** 2-символьний шістнадцятковий запис (HEX, великі літери)

Приклад: якщо обчислена контрольна сума становить `0x46`, до номера KSeF буде додано `"46"`.

## Приклад мовою C#:
```csharp
using KSeF.Client.Core;

bool isValid = KsefNumberValidator.IsValid(ksefNumber, out string message);
```

## Приклад мовою Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
KSeFNumberValidator.ValidationResult result = KSeFNumberValidator.isValid(ksefNumber);

```
