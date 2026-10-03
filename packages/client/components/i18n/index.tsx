import type { JSX } from "solid-js";

import { I18nProvider as LinguiProvider } from "@lingui-solid/solid";
import { i18n } from "@lingui/core";

import { type LocaleOptions, Language, Languages } from "./Languages";
import { messages as en } from "./catalogs/en/messages";
import { initTime, loadTimeLocale } from "./dayjs";

export function I18nProvider(props: { children: JSX.Element }) {
  return <LinguiProvider i18n={i18n}>{props.children}</LinguiProvider>;
}

export { Language, Languages } from "./Languages";
export { timeLocale, useTime } from "./dayjs";
export { useError } from "./errors";

export async function loadAndSwitchLocale(
  key: Language,
  localeOptions: LocaleOptions,
) {
  if (key !== i18n.locale) {
    const data =
      Languages[key].i18n === "en"
        ? en
        : (await import(`./catalogs/${Languages[key].i18n}/messages.ts`))
            .messages;

    i18n.load({
      [key]: data,
    });

    i18n.activate(key);

    loadTimeLocale(Languages[key], localeOptions);
  }
}

/**
 * Preferred language as reported by the browser
 * @returns Preferred language
 */
export function browserPreferredLanguage() {
  const keys = Object.keys(Languages);
  const normalise = (key: string) => key.replace(/_/g, "-").toLowerCase();
  const find = (predicate: (key: string) => boolean) =>
    keys.find((key) => predicate(normalise(key)));

  // Check for exact matches first, then infer Chinese script from the
  // region subtag (zh-CN → zh-Hans, zh-TW → zh-Hant, ...), and finally
  // fall back to matching the primary language subtag (pt → pt-PT).
  for (const raw of navigator.languages) {
    const lang = raw.toLowerCase();

    const exact = find((key) => key === lang);
    if (exact) return exact;

    if (lang.startsWith("zh")) {
      const traditional = ["zh-tw", "zh-hk", "zh-mo", "zh-hant"].some((tag) =>
        lang.startsWith(tag),
      );
      const script = find(
        (key) => key === (traditional ? "zh-hant" : "zh-hans"),
      );
      if (script) return script;
    }

    const primary = lang.split("-")[0];
    const partial = find(
      (key) => key === primary || key.split("-")[0] === primary,
    );
    if (partial) return partial;
  }

  return Language.ENGLISH;
}

/**
 * Initialise i18n engine
 */
export function initI18n() {
  i18n.load({
    en,
  });

  i18n.activate("en");

  initTime();
}

initI18n();
