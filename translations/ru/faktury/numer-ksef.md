---
original: faktury/numer-ksef.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [faktury/numer-ksef.md](https://github.com/CIRFMF/ksef-docs/blob/main/faktury/numer-ksef.md)

# Номер KSeF – структура и валидация

Номер KSeF – это уникальный идентификатор счета-фактуры, присваиваемый системой. Всегда имеет длину **35 символов** и является глобально уникальным – однозначно идентифицирует каждую фактуру в KSeF.

## Общая структура номера 
```
9999999999-RRRRMMDD-FFFFFFFFFFFF-FF  
```
Где:
- `9999999999` – NIP продавца (10 цифр),
- `RRRRMMDD` – дата принятия счета-фактуры (год, месяц, день) к дальнейшей обработке,
- `FFFFFFFFFFFF` – техническая часть, состоящая из 12 символов в шестнадцатеричной записи, только [0–9 A–F], заглавные буквы,
- `FF` – контрольная сумма CRC-8 - 2 символа в шестнадцатеричной записи, только [0–9 A–F], заглавные буквы.

## Пример
```
5265877635-20250826-0100001AF629-AF
```
- `5265877635` - NIP продавца,
- `20250826` - дата принятия счета-фактуры к дальнейшей обработке,
- `0100001AF629` - техническая часть,
- `AF` - контрольная сумма CRC-8.

## Валидация номера KSeF

Процесс валидации включает:
1. Проверку, что номер имеет **ровно 35 символов**.  
2. Разделение части данных (32 символа) и контрольной суммы (2 символа).  
3. Вычисление контрольной суммы из части данных **алгоритмом CRC-8**.  
4. Сравнение вычисленной суммы со значением, находящимся в номере.

## Алгоритм CRC-8

Для вычисления контрольной суммы применяется алгоритм **CRC-8** с параметрами:

- **Полином:** `0x07`  
- **Начальное значение:** `0x00`  
- **Формат результата:** 2-символьная шестнадцатеричная запись (HEX, заглавные буквы)

Пример: если вычисленная контрольная сумма составляет `0x46`, к номеру KSeF будет добавлено `"46"`.

## Пример на языке C#:
```csharp
using KSeF.Client.Core;

bool isValid = KsefNumberValidator.IsValid(ksefNumber, out string message);
```

## Пример на языке Java:
[OnlineSessionIntegrationTest.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/integrationTest/java/pl/akmf/ksef/sdk/OnlineSessionIntegrationTest.java)

```java
KSeFNumberValidator.ValidationResult result = KSeFNumberValidator.isValid(ksefNumber);

```
