import { en, type ContentKeys } from './en';
import { hu } from './hu';
import { de } from './de';

export type SupportedLanguage = 'en' | 'hu' | 'de';

export const contents: Record<SupportedLanguage, ContentKeys> = {
  en,
  hu,
  de,
};

export const defaultLanguage: SupportedLanguage = 'en';

/**
 * Get content for a specific language with fallback to English
 */
export function getContent(language: SupportedLanguage): ContentKeys {
  return contents[language] || contents[defaultLanguage];
}

/**
 * Get a specific content value by path
 * Example: getContentValue('en', 'hero.headline') => 'Experience Tranquility'
 */
export function getContentValue(
  language: SupportedLanguage,
  path: string
): string {
  const content = getContent(language);
  const keys = path.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = content;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to English if path not found
      value = contents[defaultLanguage];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return path; // Return the path itself if not found
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : path;
}

/**
 * Replace placeholders in content strings
 * Example: replacePlaceholders('© {year} Lillybeth', { year: 2024 })
 */
export function replacePlaceholders(
  text: string,
  replacements: Record<string, string | number>
): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export { en, hu, de };
export type { ContentKeys };
