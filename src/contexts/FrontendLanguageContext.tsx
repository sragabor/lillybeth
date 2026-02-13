'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  type SupportedLanguage,
  type ContentKeys,
  getContent,
  defaultLanguage,
} from '@/contents';

const STORAGE_KEY = 'frontend-language';
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hu', 'de'];

interface FrontendLanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  content: ContentKeys;
  t: ContentKeys; // Alias for content (shorter)
}

const FrontendLanguageContext = createContext<FrontendLanguageContextType | undefined>(undefined);

interface FrontendLanguageProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
}

export function FrontendLanguageProvider({
  children,
  initialLanguage = defaultLanguage,
}: FrontendLanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
        setLanguageState(stored as SupportedLanguage);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  // Get content for current language
  const content = getContent(language);

  // Prevent flash of default language before localStorage is read
  if (!isInitialized) {
    return null;
  }

  return (
    <FrontendLanguageContext.Provider
      value={{
        language,
        setLanguage,
        content,
        t: content,
      }}
    >
      {children}
    </FrontendLanguageContext.Provider>
  );
}

/**
 * Hook to access frontend language and translations
 */
export function useFrontendLanguage(): FrontendLanguageContextType {
  const context = useContext(FrontendLanguageContext);
  if (context === undefined) {
    throw new Error('useFrontendLanguage must be used within a FrontendLanguageProvider');
  }
  return context;
}

/**
 * Language names for display
 */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  hu: 'Magyar',
  de: 'Deutsch',
};

/**
 * Language flags (emoji) for display
 */
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  hu: '🇭🇺',
  de: '🇩🇪',
};

export { SUPPORTED_LANGUAGES };
export type { SupportedLanguage };
