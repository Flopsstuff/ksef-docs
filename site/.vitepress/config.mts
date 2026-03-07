import { defineConfig } from "vitepress";
import sidebars from "./sidebars.json";

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
        sidebar: sidebars.pl || [],
        nav: [{ text: "Strona główna", link: "/pl/" }],
        outline: { label: "Spis treści" },
      },
    },
    ru: {
      label: "Русский",
      lang: "ru",
      themeConfig: {
        sidebar: sidebars.ru || [],
        nav: [{ text: "Главная", link: "/ru/" }],
        outline: { label: "Содержание" },
      },
    },
    en: {
      label: "English",
      lang: "en",
      themeConfig: {
        sidebar: sidebars.en || [],
        nav: [{ text: "Home", link: "/en/" }],
        outline: { label: "On this page" },
      },
    },
    uk: {
      label: "Українська",
      lang: "uk",
      themeConfig: {
        sidebar: sidebars.uk || [],
        nav: [{ text: "Головна", link: "/uk/" }],
        outline: { label: "На цій сторінці" },
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
