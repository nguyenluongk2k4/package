"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import headerDict from "../../locales/header.json";
import footerDict from "../../locales/footer.json";
import commonDict from "../../locales/common.json";

const defaultLocale = "vi";
const storageKey = "sac-co-do-locale";

// Tier 1: shared chrome (header/footer/common) merged into one flat dictionary
// per locale, so existing call sites like t("header.nav.home") keep working.
const dictionaries = {
  vi: { ...headerDict.vi, ...footerDict.vi, ...commonDict.vi },
  en: { ...headerDict.en, ...footerDict.en, ...commonDict.en },
};

// Tier 2: per-page dictionaries (e.g. locales/home.json) are imported directly
// by the page/component and read through translate(dict, locale, key), which
// supports dot-path lookup into nested JSON instead of a flat key.
export function translate(dict, locale, key) {
  const fromLocale = getPath(dict?.[locale], key);
  if (fromLocale !== undefined) return fromLocale;

  const fromDefault = getPath(dict?.[defaultLocale], key);
  if (fromDefault !== undefined) return fromDefault;

  return key;
}

function getPath(source, path) {
  if (!source) return undefined;
  return path.split(".").reduce((value, part) => (value == null ? undefined : value[part]), source);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(defaultLocale);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(storageKey);
    if (savedLocale && dictionaries[savedLocale]) {
      setLocaleState(savedLocale);
      document.documentElement.lang = savedLocale;
      return;
    }

    document.documentElement.lang = defaultLocale;
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
