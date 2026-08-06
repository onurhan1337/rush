'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, type Locale, type TranslationKey } from './dictionaries';

const LOCALE_KEY = 'rush.locale';

type Translate = (key: TranslationKey) => string;

const I18nContext = createContext<Translate>((key) => dictionaries.tr[key]);

function normalize(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('en') ? 'en' : 'tr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'tr';
    const cached = window.sessionStorage?.getItem(LOCALE_KEY);
    return cached === 'en' || cached === 'tr' ? cached : 'tr';
  });

  useEffect(() => {
    let cancelled = false;

    AppBridgeHelper.getDashboardLanguage()
      .then((language) => {
        if (cancelled) return;
        const next = normalize(language);
        setLocale(next);
        try {
          window.sessionStorage.setItem(LOCALE_KEY, next);
        } catch {
          // caching the locale is optional
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const translate = useMemo<Translate>(() => (key) => dictionaries[locale][key] ?? dictionaries.tr[key], [locale]);

  return <I18nContext.Provider value={translate}>{children}</I18nContext.Provider>;
}

export function useT(): Translate {
  return useContext(I18nContext);
}
