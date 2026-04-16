// Tiny no-framework i18n. Dotted-key lookup into flat JSON catalogues,
// English fallback, dev-only warning the first time a key is missing.
// Components read `{ locale, t }` from LocaleContext via useLocale().

import React, { createContext, useContext } from "react";
import enMessages from "../i18n/en.json";
import esMessages from "../i18n/es.json";

/** @typedef {"en" | "es"} Locale */

export const LOCALES = { en: enMessages, es: esMessages };
export const LOCALE_LABELS = { en: "EN", es: "ES" };

export const LocaleContext = createContext(
  /** @type {{ locale: Locale, t: (k: string) => string }} */
  ({ locale: "en", t: (k) => k }),
);

export const useLocale = () => useContext(LocaleContext);

function resolveMessage(messages, key) {
  if (!key) return "";
  const parts = key.split(".");
  let node = messages;
  for (const p of parts) {
    if (node == null || typeof node !== "object") return null;
    node = node[p];
  }
  return typeof node === "string" ? node : null;
}

/**
 * @param {Locale} locale
 * @returns {(key: string) => string}
 */
export function createTranslator(locale) {
  const loggedMissing = new Set();
  return function t(key) {
    const msg = resolveMessage(LOCALES[locale] || LOCALES.en, key)
      ?? resolveMessage(LOCALES.en, key);
    if (msg == null) {
      if (import.meta.env.DEV && !loggedMissing.has(key)) {
        loggedMissing.add(key);
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }
    return msg;
  };
}
