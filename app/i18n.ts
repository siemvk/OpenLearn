import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import nlTranslation from "./locales/nl.json";

export function initI18n(lang: string = "nl") {
  const lng = lang || "nl";

  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      lng,
      fallbackLng: "nl",
      resources: {
        nl: nlTranslation,
        // en: enTranslation,
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      initImmediate: false,
    });
  } else {
    i18n.changeLanguage(lng);
  }

  return i18n;
}