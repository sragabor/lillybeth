import {
  LocalizedText,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from './types';

/**
 * Get the localized value from a multilingual field
 * Falls back to default language if the requested language is not available
 */
export function getLocalizedText(
  field: LocalizedText | null | undefined,
  lang: SupportedLanguage,
  fallbackLang: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  if (!field) return '';

  // Try requested language first
  if (field[lang] && field[lang].trim() !== '') {
    return field[lang];
  }

  // Fall back to fallback language
  if (field[fallbackLang] && field[fallbackLang].trim() !== '') {
    return field[fallbackLang];
  }

  // Return first available value
  for (const l of SUPPORTED_LANGUAGES) {
    if (field[l] && field[l].trim() !== '') {
      return field[l];
    }
  }

  return '';
}

/**
 * Create an empty localized text object
 */
export function createEmptyLocalizedText(): LocalizedText {
  return {
    en: '',
    hu: '',
    de: '',
  };
}

/**
 * Create a localized text object with a value for a specific language
 */
export function createLocalizedText(
  value: string,
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): LocalizedText {
  return {
    ...createEmptyLocalizedText(),
    [lang]: value,
  };
}

/**
 * Check if all required languages have content
 */
export function validateLocalizedText(
  field: LocalizedText | null | undefined,
  requiredLangs: SupportedLanguage[] = SUPPORTED_LANGUAGES
): { valid: boolean; missing: SupportedLanguage[] } {
  if (!field) {
    return { valid: false, missing: requiredLangs };
  }

  const missing = requiredLangs.filter(
    (lang) => !field[lang] || field[lang].trim() === ''
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if at least one language has content
 */
export function hasAnyContent(field: LocalizedText | null | undefined): boolean {
  if (!field) return false;

  return SUPPORTED_LANGUAGES.some(
    (lang) => field[lang] && field[lang].trim() !== ''
  );
}

/**
 * Merge two localized text objects, preferring values from the second object
 */
export function mergeLocalizedText(
  base: LocalizedText | null | undefined,
  override: LocalizedText | null | undefined
): LocalizedText {
  const result = createEmptyLocalizedText();

  for (const lang of SUPPORTED_LANGUAGES) {
    result[lang] = override?.[lang] || base?.[lang] || '';
  }

  return result;
}

/**
 * Convert a plain string to a localized text object
 * Useful for migrating legacy data
 */
export function stringToLocalizedText(
  value: string | null | undefined,
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): LocalizedText {
  if (!value) return createEmptyLocalizedText();
  return createLocalizedText(value, lang);
}

/**
 * Check if a value is a valid LocalizedText object
 */
export function isLocalizedText(value: unknown): value is LocalizedText {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  // Check that all keys are valid language codes and all values are strings
  for (const key of Object.keys(obj)) {
    if (!SUPPORTED_LANGUAGES.includes(key as SupportedLanguage)) {
      return false;
    }
    if (typeof obj[key] !== 'string' && obj[key] !== undefined) {
      return false;
    }
  }

  return true;
}

/**
 * Parse a JSON value into a LocalizedText object
 * Handles both string and object inputs for backward compatibility
 */
export function parseLocalizedText(
  value: unknown,
  fallbackLang: SupportedLanguage = DEFAULT_LANGUAGE
): LocalizedText {
  // Already a valid LocalizedText
  if (isLocalizedText(value)) {
    return value;
  }

  // Plain string - convert to localized
  if (typeof value === 'string') {
    return stringToLocalizedText(value, fallbackLang);
  }

  // Null/undefined
  if (value === null || value === undefined) {
    return createEmptyLocalizedText();
  }

  // Unknown type - return empty
  return createEmptyLocalizedText();
}
