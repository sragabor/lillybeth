'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useFrontendLanguage,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/contexts/FrontendLanguageContext';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline';
  showFlags?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlags = true,
  showLabels = true,
  className = '',
}: LanguageSelectorProps) {
  const { language, setLanguage } = useFrontendLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
              ${
                language === lang
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }
            `}
            aria-label={`Switch to ${LANGUAGE_LABELS[lang]}`}
            aria-current={language === lang ? 'true' : undefined}
          >
            {showFlags && <span className="mr-1">{LANGUAGE_FLAGS[lang]}</span>}
            {showLabels ? LANGUAGE_LABELS[lang] : lang.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 text-sm font-medium
          text-stone-700 hover:text-stone-900
          bg-white/80 hover:bg-white
          border border-stone-200 rounded-lg
          transition-all duration-200
          shadow-sm hover:shadow
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlags && <span>{LANGUAGE_FLAGS[language]}</span>}
        <span>{showLabels ? LANGUAGE_LABELS[language] : language.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 mt-2 py-1 w-40
            bg-white border border-stone-200 rounded-lg shadow-lg
            z-50 animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-2 px-4 py-2 text-sm text-left
                transition-colors duration-150
                ${
                  language === lang
                    ? 'bg-stone-100 text-stone-900 font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }
              `}
              role="option"
              aria-selected={language === lang}
            >
              {showFlags && <span>{LANGUAGE_FLAGS[lang]}</span>}
              <span>{LANGUAGE_LABELS[lang]}</span>
              {language === lang && (
                <svg className="w-4 h-4 ml-auto text-stone-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
