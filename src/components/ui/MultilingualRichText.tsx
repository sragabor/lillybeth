'use client';

import { useState } from 'react';
import {
  LocalizedText,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
} from '@/lib/i18n';
import { validateLocalizedText, createEmptyLocalizedText } from '@/lib/i18n/utils';

interface MultilingualRichTextProps {
  label: string;
  value: LocalizedText | null | undefined;
  onChange: (value: LocalizedText) => void;
  placeholder?: string;
  required?: boolean;
  requiredLanguages?: SupportedLanguage[];
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function MultilingualRichText({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  requiredLanguages = ['en'],
  disabled = false,
  className = '',
  rows = 6,
}: MultilingualRichTextProps) {
  const [activeTab, setActiveTab] = useState<SupportedLanguage>('en');

  const currentValue = value || createEmptyLocalizedText();
  const validation = validateLocalizedText(currentValue, requiredLanguages);

  const handleChange = (lang: SupportedLanguage, text: string) => {
    onChange({
      ...currentValue,
      [lang]: text,
    });
  };

  const getTabStatus = (lang: SupportedLanguage): 'filled' | 'empty' | 'required-empty' => {
    const hasContent = currentValue[lang] && currentValue[lang].trim() !== '';
    if (hasContent) return 'filled';
    if (requiredLanguages.includes(lang)) return 'required-empty';
    return 'empty';
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {!validation.valid && validation.missing.length > 0 && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Missing: {validation.missing.map((l) => l.toUpperCase()).join(', ')}
          </span>
        )}
      </div>

      {/* Language Tabs */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-300 bg-gray-50">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const status = getTabStatus(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === lang
                    ? 'bg-white text-blue-600 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-transparent'
                }`}
              >
                <span className="uppercase">{lang}</span>
                {status === 'filled' && (
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {status === 'required-empty' && (
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Editor Area */}
        <div className="p-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <div
              key={lang}
              className={activeTab === lang ? 'block' : 'hidden'}
            >
              {/* TODO: Replace textarea with proper rich text editor (e.g., Tiptap) */}
              <textarea
                value={currentValue[lang] || ''}
                onChange={(e) => handleChange(lang, e.target.value)}
                placeholder={`${placeholder} (${LANGUAGE_NAMES[lang]})`}
                disabled={disabled}
                rows={rows}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Supports plain text. Rich text editor coming soon.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
