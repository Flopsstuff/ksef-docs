import { defineConfig } from "vitepress";

const plSidebar = [
  {
    text: "Wprowadzenie",
    items: [
      { text: "Przewodnik dla Integratorow", link: "/pl/" },
      {
        text: "Przegląd kluczowych zmian",
        link: "/pl/przeglad-kluczowych-zmian-ksef-api-2-0",
      },
      { text: "Changelog", link: "/pl/api-changelog" },
      { text: "Środowiska KSeF API 2.0", link: "/pl/srodowiska" },
    ],
  },
  {
    text: "Uwierzytelnianie",
    items: [
      { text: "Uzyskiwanie dostępu", link: "/pl/uwierzytelnianie" },
      { text: "Zarządzanie sesjami", link: "/pl/auth/sesje" },
      { text: "Podpis XAdES", link: "/pl/auth/podpis-xades" },
      {
        text: "Testowe certyfikaty i podpisy",
        link: "/pl/auth/testowe-certyfikaty-i-podpisy-xades",
      },
      {
        text: "Kontekst: NIP",
        link: "/pl/auth/context-identifier-nip",
      },
      {
        text: "Kontekst: NIP VAT-UE",
        link: "/pl/auth/context-identifier-nip-vat-ue",
      },
      {
        text: "Kontekst: Internal ID",
        link: "/pl/auth/context-identifier-internal-id",
      },
      {
        text: "Podmiot: Certificate Subject",
        link: "/pl/auth/subject-identifier-type-certificate-subject",
      },
      {
        text: "Podmiot: Certificate Fingerprint",
        link: "/pl/auth/subject-identifier-type-certificate-fingerprint",
      },
    ],
  },
  {
    text: "Certyfikaty",
    items: [{ text: "Certyfikaty KSeF", link: "/pl/certyfikaty-KSeF" }],
  },
  {
    text: "Uprawnienia",
    items: [{ text: "Uprawnienia", link: "/pl/uprawnienia" }],
  },
  {
    text: "Tryby offline",
    items: [
      { text: "Tryby offline", link: "/pl/tryby-offline" },
      {
        text: "Korekta techniczna",
        link: "/pl/offline/korekta-techniczna",
      },
      {
        text: "Automatyczne określanie trybu",
        link: "/pl/offline/automatyczne-okreslanie-trybu-offline",
      },
    ],
  },
  {
    text: "Sesje",
    items: [
      { text: "Sesja interaktywna", link: "/pl/sesja-interaktywna" },
      { text: "Sesja wsadowa", link: "/pl/sesja-wsadowa" },
    ],
  },
  {
    text: "Faktury",
    items: [
      { text: "Numer KSeF", link: "/pl/faktury/numer-ksef" },
      {
        text: "Weryfikacja faktury",
        link: "/pl/faktury/weryfikacja-faktury",
      },
      {
        text: "Sprawdzenie stanu i UPO",
        link: "/pl/faktury/sesja-sprawdzenie-stanu-i-pobranie-upo",
      },
    ],
  },
  {
    text: "Pobieranie faktur",
    items: [
      {
        text: "Pobieranie faktur",
        link: "/pl/pobieranie-faktur/pobieranie-faktur",
      },
      {
        text: "Przyrostowe pobieranie",
        link: "/pl/pobieranie-faktur/przyrostowe-pobieranie-faktur",
      },
      { text: "High Water Mark", link: "/pl/pobieranie-faktur/hwm" },
    ],
  },
  {
    text: "Pozostałe",
    items: [
      { text: "Kody QR", link: "/pl/kody-qr" },
      { text: "Tokeny KSeF", link: "/pl/tokeny-ksef" },
      { text: "Limity", link: "/pl/limity/limity" },
      { text: "Limity API", link: "/pl/limity/limity-api" },
      { text: "Dane testowe", link: "/pl/dane-testowe-scenariusze" },
    ],
  },
];

const ruSidebar = [
  {
    text: "Введение",
    items: [
      { text: "Руководство для Интеграторов", link: "/ru/" },
      {
        text: "Обзор ключевых изменений",
        link: "/ru/przeglad-kluczowych-zmian-ksef-api-2-0",
      },
      { text: "Среды KSeF API 2.0", link: "/ru/srodowiska" },
    ],
  },
  {
    text: "Аутентификация",
    items: [
      { text: "Получение доступа", link: "/ru/uwierzytelnianie" },
      { text: "Управление сессиями", link: "/ru/auth/sesje" },
      { text: "Подпись XAdES", link: "/ru/auth/podpis-xades" },
      {
        text: "Тестовые сертификаты и подписи",
        link: "/ru/auth/testowe-certyfikaty-i-podpisy-xades",
      },
      {
        text: "Контекст: NIP",
        link: "/ru/auth/context-identifier-nip",
      },
      {
        text: "Контекст: NIP VAT-UE",
        link: "/ru/auth/context-identifier-nip-vat-ue",
      },
      {
        text: "Контекст: Internal ID",
        link: "/ru/auth/context-identifier-internal-id",
      },
      {
        text: "Субъект: Certificate Subject",
        link: "/ru/auth/subject-identifier-type-certificate-subject",
      },
      {
        text: "Субъект: Certificate Fingerprint",
        link: "/ru/auth/subject-identifier-type-certificate-fingerprint",
      },
    ],
  },
  {
    text: "Сертификаты",
    items: [{ text: "Сертификаты KSeF", link: "/ru/certyfikaty-KSeF" }],
  },
  {
    text: "Офлайн режимы",
    items: [
      { text: "Офлайн режимы", link: "/ru/tryby-offline" },
      {
        text: "Техническая коррекция",
        link: "/ru/offline/korekta-techniczna",
      },
      {
        text: "Автоматическое определение режима",
        link: "/ru/offline/automatyczne-okreslanie-trybu-offline",
      },
    ],
  },
  {
    text: "Сессии",
    items: [
      { text: "Интерактивная сессия", link: "/ru/sesja-interaktywna" },
      { text: "Пакетная сессия", link: "/ru/sesja-wsadowa" },
    ],
  },
  {
    text: "Счета-фактуры",
    items: [
      { text: "Номер KSeF", link: "/ru/faktury/numer-ksef" },
      {
        text: "Верификация счета",
        link: "/ru/faktury/weryfikacja-faktury",
      },
      {
        text: "Проверка состояния и UPO",
        link: "/ru/faktury/sesja-sprawdzenie-stanu-i-pobranie-upo",
      },
    ],
  },
  {
    text: "Получение счетов-фактур",
    items: [
      {
        text: "Получение счетов-фактур",
        link: "/ru/pobieranie-faktur/pobieranie-faktur",
      },
      {
        text: "Инкрементальное получение",
        link: "/ru/pobieranie-faktur/przyrostowe-pobieranie-faktur",
      },
      { text: "High Water Mark", link: "/ru/pobieranie-faktur/hwm" },
    ],
  },
  {
    text: "Прочее",
    items: [
      { text: "QR-коды", link: "/ru/kody-qr" },
      { text: "Токены KSeF", link: "/ru/tokeny-ksef" },
      { text: "Лимиты", link: "/ru/limity/limity" },
      { text: "Лимиты API", link: "/ru/limity/limity-api" },
      { text: "Тестовые данные", link: "/ru/dane-testowe-scenariusze" },
    ],
  },
];

export default defineConfig({
  title: "KSeF 2.0 Docs",
  description:
    "Translated documentation for Poland's National e-Invoice System (KSeF) API 2.0",
  base: "/ksef-docs/",

  srcDir: ".",

  // Some translated docs link to files not yet translated or to binary files (XSD, etc.)
  ignoreDeadLinks: true,

  locales: {
    root: {
      lang: "en",
    },
    pl: {
      label: "Polski",
      lang: "pl",
      themeConfig: {
        sidebar: plSidebar,
        nav: [{ text: "Strona główna", link: "/pl/" }],
        outline: { label: "Spis treści" },
      },
    },
    ru: {
      label: "Русский",
      lang: "ru",
      themeConfig: {
        sidebar: ruSidebar,
        nav: [{ text: "Главная", link: "/ru/" }],
        outline: { label: "Содержание" },
      },
    },
    en: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [{ text: "Home", link: "/en/" }],
      },
    },
  },

  themeConfig: {
    logoLink: "/ksef-docs/",
    socialLinks: [
      { icon: "github", link: "https://github.com/Flopsstuff/ksef-docs" },
    ],
  },
});
