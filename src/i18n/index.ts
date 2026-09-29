import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode, createElement } from 'react';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import es from './locales/es.json';

export type Language = 'de' | 'en' | 'fr' | 'it' | 'es';

// Native-name labels stay in each language even in the picker — that's how
// language pickers everywhere read (English shows "English", French "Français"
// etc.), and it lets a user who accidentally landed in the wrong language
// still find their own.
export const LANGUAGES: { code: Language; nativeLabel: string }[] = [
  { code: 'de', nativeLabel: 'Deutsch' },
  { code: 'en', nativeLabel: 'English' },
  { code: 'fr', nativeLabel: 'Français' },
  { code: 'it', nativeLabel: 'Italiano' },
  { code: 'es', nativeLabel: 'Español' },
];

const LOCALES: Record<Language, Record<string, string>> = { de, en, fr, it, es };
const STORAGE_KEY = 'lomira-language';

/**
 * Reads the initial language: stored user preference wins; otherwise the
 * device's own language (navigator.language reflects the iOS system language
 * inside the Capacitor WKWebView); otherwise German. Only the five supported
 * codes are accepted — anything else falls through to German rather than
 * setting an unsupported locale we have no translations for.
 */
function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LOCALES as Record<string, unknown>)[stored]) return stored as Language;
  } catch {
    // localStorage can throw in some webview edge cases — fall through to the
    // system-language detection below rather than crashing the whole app.
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : 'de';
  if ((LOCALES as Record<string, unknown>)[nav]) return nav as Language;
  return 'de';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /**
   * Translate a key. Fallback chain: current locale → English → the key
   * itself, so a missing translation is visible but doesn't crash the UI.
   * `vars` performs simple `{name}` substitution — used for one-off dynamic
   * pieces like "{count} Tage" without pulling in a full ICU formatter.
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? String(vars[name]) : `{${name}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Best-effort — a failed persist means the user's choice is only for
      // this session, still better than crashing.
    }
    // Kept in sync so screen-readers and CSS's :lang() selector see the
    // current language.
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      // Fallback chain: current locale → English → German → the raw key.
      // German sits second-last (not just at the end for tolerance): the
      // lessons and any other long-form German content live in de.json
      // only for now, so a screen using t() for both UI chrome and long
      // content ends up with translated chrome plus German content in
      // FR/IT/ES/EN — deliberately, per the "Etappe 1 lässt Lektionen
      // auf Deutsch" decision.
      const primary = LOCALES[language][key];
      if (primary != null) return interpolate(primary, vars);
      const en = LOCALES.en[key];
      if (en != null) return interpolate(en, vars);
      const de = LOCALES.de[key];
      if (de != null) return interpolate(de, vars);
      return key;
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return createElement(LanguageContext.Provider, { value }, children);
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT() must be used inside <LanguageProvider>');
  return ctx;
}

// Convenience for anywhere that needs the current locale for Intl formatters
// (dates, numbers) — maps our two-letter codes to full BCP-47 tags iOS/Intl
// know about.
export function toBcp47(lang: Language): string {
  switch (lang) {
    case 'de': return 'de-DE';
    case 'en': return 'en-US';
    case 'fr': return 'fr-FR';
    case 'it': return 'it-IT';
    case 'es': return 'es-ES';
  }
}

/**
 * useLocale — the current app language expressed as a BCP-47 tag ready for
 * Intl.DateTimeFormat / Number.toLocaleString / Date.toLocaleTimeString.
 * A separate hook, not tucked inside useT(), so a component that only
 * needs the locale for one format call doesn't have to destructure t/
 * setLanguage it doesn't use.
 */
export function useLocale(): string {
  return toBcp47(useT().language);
}
