"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "../../locales/en.json";
import vi from "../../locales/vi.json";

const dictionaries = { vi, en };
const defaultLocale = "vi";
const storageKey = "sac-co-do-locale";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(defaultLocale);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(storageKey);
    if (savedLocale && dictionaries[savedLocale]) {
      setLocaleState(savedLocale);
      document.documentElement.lang = savedLocale;
    }
  }, []);

  const value = useMemo(() => {
    function setLocale(nextLocale) {
      if (!dictionaries[nextLocale]) return;
      setLocaleState(nextLocale);
      window.localStorage.setItem(storageKey, nextLocale);
      document.documentElement.lang = nextLocale;
    }

    function t(key) {
      return dictionaries[locale]?.[key] || dictionaries[defaultLocale][key] || key;
    }

    return {
      locale,
      locales: Object.keys(dictionaries),
      setLocale,
      t,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}
