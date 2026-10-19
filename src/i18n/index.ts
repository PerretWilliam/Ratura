import { createContext, useContext } from "react";
import { MESSAGES, type Message } from "./messages";
import de from "./locales/de";
import es from "./locales/es";
import fr from "./locales/fr";
import it from "./locales/it";
import ja from "./locales/ja";
import nl from "./locales/nl";
import pl from "./locales/pl";
import ptBR from "./locales/pt-BR";
import ru from "./locales/ru";
import tr from "./locales/tr";
import uk from "./locales/uk";

export type { Message };
/** English source strings mapped to their translation; missing ones fall back to English. */
export type Translations = Partial<Record<Message, string>>;
export type Vars = Record<string, string | number>;

export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {},
  fr,
  de,
  es,
  it,
  "pt-BR": ptBR,
  nl,
  pl,
  tr,
  ru,
  uk,
  ja,
};

/** "system" (or anything unknown) follows the OS languages, then English. */
export function resolveLanguage(
  setting: string | undefined,
  systemLanguages: readonly string[] = navigator.languages,
): LanguageCode {
  const known = LANGUAGES.find((language) => language.code === setting);
  if (known) return known.code;
  for (const tag of systemLanguages) {
    const lower = tag.toLowerCase();
    const match =
      LANGUAGES.find((language) => language.code.toLowerCase() === lower) ??
      LANGUAGES.find(
        (language) => language.code.split("-")[0] === lower.split("-")[0],
      );
    if (match) return match.code;
  }
  return "en";
}

/** Share of UI strings translated, 0–100. */
export function completion(code: LanguageCode): number {
  if (code === "en") return 100;
  const translations = TRANSLATIONS[code];
  const done = MESSAGES.filter((key) => translations[key]).length;
  return Math.floor((done / MESSAGES.length) * 100);
}

export function translate(code: LanguageCode, key: Message, vars?: Vars): string {
  const text = TRANSLATIONS[code][key] || key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in vars ? String(vars[name]) : placeholder,
  );
}

let currentLanguage: LanguageCode = "en";

export function setCurrentLanguage(code: LanguageCode) {
  currentLanguage = code;
  document.documentElement.lang = code;
}

/** Translates outside React (toasts, native menus); components use `useT`. */
export function t(key: Message, vars?: Vars): string {
  return translate(currentLanguage, key, vars);
}

/** Marks a string stored in a constant so it is collected, then translated with `t`. */
export const msg = <T extends Message>(key: T): T => key;

export type Translate = (key: Message, vars?: Vars) => string;

export const I18nContext = createContext<Translate>(t);

export function useT(): Translate {
  return useContext(I18nContext);
}
