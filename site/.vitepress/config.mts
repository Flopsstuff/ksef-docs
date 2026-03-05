import { defineConfig } from "vitepress";

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
      label: "Home",
      lang: "en",
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
    socialLinks: [
      { icon: "github", link: "https://github.com/flop/ksef-docs" },
    ],
  },
});
