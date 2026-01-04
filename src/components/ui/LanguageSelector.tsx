'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
} from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
  showFullName?: boolean;
}

export function LanguageSelector({
  className = '',
  showFullName = false,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="uppercase font-semibold">{language}</span>
        {showFullName && (
          <span className="text-gray-500">{LANGUAGE_NAMES[language]}</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleSelect(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                lang === language
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700'
              }`}
              role="option"
              aria-selected={lang === language}
            >
              <span className="uppercase font-semibold w-6">{lang}</span>
              <span className={lang === language ? 'text-blue-600' : 'text-gray-500'}>
                {LANGUAGE_NAMES[lang]}
              </span>
              {lang === language && (
                <svg
                  className="w-4 h-4 ml-auto text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
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
