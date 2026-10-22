"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import te from "../locales/te.json";

export type Language = "en" | "hi" | "te";

interface Translations {
  [key: string]: any;
}

const translations: Record<Language, Translations> = {
  en,
  hi,
  te,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (path: string) => path,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("learnbridge_lang") as Language;
    if (saved && (saved === "en" || saved === "hi" || saved === "te")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("learnbridge_lang", lang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallbackCurrent: any = translations["en"];
        for (const fKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === "object" && fKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackCurrent === "string" ? fallbackCurrent : fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
