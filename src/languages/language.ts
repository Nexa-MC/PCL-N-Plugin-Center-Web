export type SupportedLanguage = "zh" | "en";

/**
 * Normalize browser, persisted and route-provided locale values to the two
 * locales shipped by the website.
 */
export const normalizeLanguage = (
  value: unknown,
  fallback: SupportedLanguage = "en"
): SupportedLanguage => {
  if (typeof value !== "string") return fallback;

  const language = value.trim().toLowerCase().replace(/_/g, "-");
  if (language === "cn" || language === "zh" || language.startsWith("zh-")) return "zh";
  if (language === "en" || language.startsWith("en-")) return "en";
  return fallback;
};

export const getBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === "undefined") return "en";
  return normalizeLanguage(navigator.language || (navigator as Navigator & { browserLanguage?: string }).browserLanguage);
};

export const getDocumentLanguage = (language: SupportedLanguage): "zh-CN" | "en-US" =>
  language === "zh" ? "zh-CN" : "en-US";

const STORAGE_KEY = "nexa:lang";

/** The language the visitor chose on a previous visit, if any. */
export const getStoredLanguage = (): SupportedLanguage | undefined => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "zh" || stored === "en" ? stored : undefined;
  } catch {
    return undefined; // Storage can be disabled; the browser language still applies.
  }
};

/** A saved choice wins over the browser language. */
export const getInitialLanguage = (): SupportedLanguage =>
  getStoredLanguage() ?? getBrowserLanguage();

export const persistLanguage = (language: SupportedLanguage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* Private mode still allows switching for this visit. */
  }
};
