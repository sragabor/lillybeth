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
  SupportedLanguage,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from '@/lib/i18n';

const STORAGE_KEY = 'admin-language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isValidLanguage: (lang: string) => lang is SupportedLanguage;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}

export function LanguageProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);
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

  const isValidLanguage = useCallback(
    (lang: string): lang is SupportedLanguage => {
      return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
    },
    []
  );

  // Prevent flash of default language before localStorage is read
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isValidLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for getting localized text with the current language
export function useLocalizedText() {
  const { language } = useLanguage();

  const getLocalizedText = useCallback(
    (field: Record<string, string> | null | undefined): string => {
      if (!field) return '';

      // Try current language first
      if (field[language] && field[language].trim() !== '') {
        return field[language];
      }

      // Fall back to English
      if (field['en'] && field['en'].trim() !== '') {
        return field['en'];
      }

      // Return first available value
      for (const lang of SUPPORTED_LANGUAGES) {
        if (field[lang] && field[lang].trim() !== '') {
          return field[lang];
        }
      }

      return '';
    },
    [language]
  );

  return { language, getLocalizedText };
}
