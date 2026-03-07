---
original: offline/korekta-techniczna.md
source_repo: https://github.com/CIRFMF/ksef-docs
source_commit: 6fb819b
last_translated: 2026-03-07
---

> **Translation.** Original: [offline/korekta-techniczna.md](https://github.com/CIRFMF/ksef-docs/blob/main/offline/korekta-techniczna.md)

# Технічна корекція рахунка-фактури offline  
20.08.2025  

## Опис функціональності  
Технічна корекція дозволяє повторно надіслати рахунок-фактуру, виставлену в [режимі offline](../tryby-offline.md), яка після відправлення в систему KSeF була **відхилена** через технічні помилки, наприклад:  
- невідповідність схемі,  
- перевищення допустимого розміру файлу,
- дублікат рахунка-фактури,
- інші **помилки технічної валідації**, що унеможливлюють присвоєння ```номера KSeF```.


> **Увага**!
1. Технічна корекція **не стосується** ситуацій, пов'язаних з відсутністю повноважень суб'єктів, що фігурують на рахунку-фактурі (напр. самофактурування, валідація відносин для ОМС або групи ПДВ).
2. В цьому режимі **не дозволяється** коригувати зміст рахунка-фактури – технічна корекція стосується виключно технічних проблем, що унеможливлюють її прийняття в системі KSeF.
3. Технічна корекція може надсилатися виключно в [інтерактивній сесії](../sesja-interaktywna.md), натомість може стосуватися рахунків-фактур offline, відхилених як в [інтерактивній сесії](../sesja-interaktywna.md), так і в [пакетній сесії](../sesja-wsadowa.md).
4. Заборонено технічно коригувати рахунок-фактуру offline, для якої вже була прийнята інша правильна корекція.

## Приклад перебігу технічної корекції рахунка-фактури offline  

1. **Продавець виставляє рахунок-фактуру в режимі offline.**  
   - Рахунок-фактура містить два QR-коди:  
     - **QR-код I** – дозволяє верифікацію рахунка-фактури в системі KSeF,  
     - **QR-код II** – дозволяє підтвердження автентичності виставника на основі [сертифіката KSeF](../certyfikaty-KSeF.md).  

2. **Клієнт отримує візуалізацію рахунка-фактури (напр. у вигляді роздруківки).**  
   - Після сканування **QR-коду I** клієнт отримує інформацію, що рахунок-фактура **ще не була надіслана в систему KSeF**.  
   - Після сканування **QR-коду II** клієнт отримує інформацію про сертифікат KSeF, який підтверджує автентичність виставника.  

3. **Продавець надсилає рахунок-фактуру offline в систему KSeF.**  
   - Система KSeF верифікує документ.  
   - Рахунок-фактура **відхиляється** через технічну помилку (напр. неправильна відповідність схемі XSD).  

4. **Продавець оновлює своє програмне забезпечення** і повторно генерує рахунок-фактуру з тим самим змістом, але відповідну схемі.  
   - Оскільки зміст XML відрізняється від початкової версії, **хеш SHA-256 файлу рахунка-фактури інший**.

5. **Продавець надсилає виправлений рахунок-фактуру як технічну корекцію.**  
   - Вказує в полі `hashOfCorrectedInvoice` хеш SHA-256 початкової, відхиленої рахунка-фактури offline.  
   - Параметр `offlineMode` встановлено на `true`.  

6. **Система KSeF правильно приймає рахунок-фактуру.**  
   - Документ отримує номер KSeF.  
   - Рахунок-фактура **пов'язується з початковою рахунком-фактурою offline**, хеш якої був вказаний в полі `hashOfCorrectedInvoice`.  
   - Завдяки цьому можливе перенаправлення клієнта зі "старого" QR-коду I до виправленої рахунка-фактури.

7. **Клієнт користується QR-кодом I, розміщеним на початковій рахунку-фактурі.**  
   - Система KSeF інформує, що **початкова рахунок-фактура була технічно виправлена**.  
   - Клієнт отримує метадані нової, правильно опрацьованої рахунка-фактури і має можливість її завантаження з системи.  

## Відправлення корекції  

Корекція надсилається згідно з принципами, описаними в документі [інтерактивна сесія](../sesja-interaktywna.md), з додатковим налаштуванням:  
- `offlineMode: true`,  
- `hashOfCorrectedInvoice` – хеш початкової рахунка-фактури.  

Приклад мовою C#:
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

Приклад мовою Java:
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

## Пов'язані документи
- [Режими offline](../tryby-offline.md)
- [QR-коди](../kody-qr.md)
