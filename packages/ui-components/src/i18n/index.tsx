import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ar, en, type Dict, type Locale, DEFAULT_LOCALE } from './locales/ar';

const dictionaries: Record<Locale, Dict> = { ar, en };

export type { Locale, Dict };
export { DEFAULT_LOCALE, ARABIC_LOCALE } from './locales/ar';

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let str = dictionaries[locale]?.[key] ?? dictionaries.ar[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale: initialLocale = DEFAULT_LOCALE,
  onChange,
  children,
}: {
  locale?: Locale;
  onChange?: (locale: Locale) => void;
  children?: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    let locale = initialLocale;
    return {
      get locale() {
        return locale;
      },
      setLocale(next: Locale) {
        locale = next;
        onChange?.(next);
      },
      t: (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    };
  }, [initialLocale, onChange]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Fallback: default Arabic without a provider (keeps components usable standalone).
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key: string, vars?: Record<string, string | number>) => translate(DEFAULT_LOCALE, key, vars),
  };
}

export function useT() {
  return useLocale().t;
}

/** Convenience alias returning the translate function (mirrors react-i18next's useTranslation). */
export function useTranslation(): (key: string, vars?: Record<string, string | number>) => string {
  return useT();
}
