---
original: offline/korekta-techniczna.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-05
---

> **Translation.** Original: [offline/korekta-techniczna.md](https://github.com/CIRFMF/ksef-docs/blob/main/offline/korekta-techniczna.md)

# Техническое исправление офлайн-счёта  
20.08.2025  

## Описание функциональности  
Техническое исправление позволяет повторно отправить счёт, выставленный в [офлайн-режиме](../tryby-offline.md), который после отправки в систему KSeF был **отклонён** из-за технических ошибок, например:  
- несоответствие схеме,  
- превышение допустимого размера файла,
- дублирование счёта,
- другие **ошибки технической валидации**, препятствующие присвоению ```номера KSeF```.


> **Внимание**!
1. Техническое исправление **не касается** ситуаций, связанных с отсутствием полномочий субъектов, указанных в счёте (например, самовыставление счёта, валидация отношений для JST или VAT-групп).
2. В этом режиме **не разрешается** исправлять содержание счёта – техническое исправление касается исключительно технических проблем, препятствующих его приёму в системе KSeF.
3. Техническое исправление может отправляться только в [интерактивной сессии](../sesja-interaktywna.md), но может касаться офлайн-счетов, отклонённых как в [интерактивной сессии](../sesja-interaktywna.md), так и в [пакетной сессии](../sesja-wsadowa.md).
4. Недопустимо техническое исправление офлайн-счёта, для которого уже было принято другое правильное исправление.

## Пример процесса технического исправления офлайн-счёта  

1. **Продавец выставляет счёт в офлайн-режиме.**  
   - Счёт содержит два QR-кода:  
     - **QR-код I** – позволяет верификацию счёта в системе KSeF,  
     - **QR-код II** – позволяет подтвердить подлинность выставителя на основе [сертификата KSeF](../certyfikaty-KSeF.md).  

2. **Клиент получает визуализацию счёта (например, в виде распечатки).**  
   - После сканирования **QR-кода I** клиент получает информацию о том, что счёт **ещё не был отправлен в систему KSeF**.  
   - После сканирования **QR-кода II** клиент получает информацию о сертификате KSeF, который подтверждает подлинность выставителя.  

3. **Продавец отправляет офлайн-счёт в систему KSeF.**  
   - Система KSeF проверяет документ.  
   - Счёт **отклоняется** из-за технической ошибки (например, неправильное соответствие схеме XSD).  

4. **Продавец обновляет своё программное обеспечение** и повторно генерирует счёт с тем же содержанием, но соответствующий схеме.  
   - Поскольку содержимое XML отличается от первоначальной версии, **хэш SHA-256 файла счёта другой**.

5. **Продавец отправляет исправленный счёт как техническое исправление.**  
   - Указывает в поле `hashOfCorrectedInvoice` хэш SHA-256 первоначального, отклонённого офлайн-счёта.  
   - Параметр `offlineMode` установлен в `true`.  

6. **Система KSeF правильно принимает счёт.**  
   - Документ получает номер KSeF.  
   - Счёт **связывается с первоначальным офлайн-счётом**, хэш которого был указан в поле `hashOfCorrectedInvoice`.  
   - Благодаря этому возможно перенаправление клиента со «старого» QR-кода I к исправленному счёту.

7. **Клиент использует QR-код I, размещённый на первоначальном счёте.**  
   - Система KSeF сообщает, что **первоначальный счёт был технически исправлен**.  
   - Клиент получает метаданные нового, правильно обработанного счёта и имеет возможность скачать его из системы.  

## Отправка исправления  

Исправление отправляется в соответствии с принципами, описанными в документе [интерактивная сессия](../sesja-interaktywna.md), с дополнительной настройкой:  
- `offlineMode: true`,  
- `hashOfCorrectedInvoice` – хэш первоначального счёта.  

Пример на языке C#:
[KSeF.Client.Tests.Core\E2E\OnlineSession\OnlineSessionE2ETests.cs](https://github.com/CIRFMF/ksef-client-csharp/blob/main/KSeF.Client.Tests.Core/E2E/OnlineSession/OnlineSessionE2ETests.cs)
```csharp
var sendOnlineInvoiceRequest = SendInvoiceOnlineSessionRequestBuilder
    .Create()
    .WithInvoiceHash(invoiceMetadata.HashSHA, invoiceMetadata.FileSize)
    .WithEncryptedDocumentHash(
        encryptedInvoiceMetadata.HashSHA, encryptedInvoiceMetadata.FileSize)
    .WithEncryptedDocumentContent(Convert.ToBase64String(encryptedInvoice))
    .WithOfflineMode(true)
    .WithHashOfCorrectedInvoice(hashOfCorrectedInvoice)    
    .Build();
```

Пример на языке Java:
[OnlineSessionController#sendTechnicalCorrection.java](https://github.com/CIRFMF/ksef-client-java/blob/main/demo-web-app/src/main/java/pl/akmf/ksef/sdk/api/OnlineSessionController.java#L120)
```java
SendInvoiceOnlineSessionRequest sendInvoiceOnlineSessionRequest = new SendInvoiceOnlineSessionRequestBuilder()
           .withInvoiceHash(invoiceMetadata.getHashSHA())
           .withInvoiceSize(invoiceMetadata.getFileSize())
           .withEncryptedInvoiceHash(encryptedInvoiceMetadata.getHashSHA())
           .withEncryptedInvoiceSize(encryptedInvoiceMetadata.getFileSize())
           .withEncryptedInvoiceContent(Base64.getEncoder().encodeToString(encryptedInvoice))
           .withOfflineMode(true)
           .withHashOfCorrectedInvoice(hashOfCorrectedInvoice)
        .build();
```

## Связанные документы
- [Офлайн-режимы](../tryby-offline.md)
- [QR-коды](../kody-qr.md)
