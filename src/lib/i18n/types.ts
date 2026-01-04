// Supported languages for the accommodation booking system
export type SupportedLanguage = 'en' | 'hu' | 'de';

// Multilingual text object structure
export type LocalizedText = {
  [K in SupportedLanguage]?: string;
};

// Language configuration
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hu', 'de'];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hu: 'Magyar',
  de: 'Deutsch',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  hu: '🇭🇺',
  de: '🇩🇪',
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
