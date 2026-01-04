'use client';

import { useState } from 'react';
import {
  LocalizedText,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
} from '@/lib/i18n';
import { validateLocalizedText, createEmptyLocalizedText } from '@/lib/i18n/utils';

interface MultilingualTextInputProps {
  label: string;
  value: LocalizedText | null | undefined;
  onChange: (value: LocalizedText) => void;
  placeholder?: string;
  required?: boolean;
  requiredLanguages?: SupportedLanguage[];
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  rows?: number;
  compact?: boolean;
}

export function MultilingualTextInput({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  requiredLanguages = ['en'],
  disabled = false,
  className = '',
  inputClassName = '',
  multiline = false,
  rows = 3,
  compact = false,
}: MultilingualTextInputProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const currentValue = value || createEmptyLocalizedText();
  const validation = validateLocalizedText(currentValue, requiredLanguages);

  const handleChange = (lang: SupportedLanguage, text: string) => {
    onChange({
      ...currentValue,
      [lang]: text,
    });
  };

  const inputBaseClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed';

  if (compact && !isExpanded) {
    // Compact view - show only primary language with expand button
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Translate
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase w-6">EN</span>
          {multiline ? (
            <textarea
              value={currentValue.en || ''}
              onChange={(e) => handleChange('en', e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={`${inputBaseClass} ${inputClassName}`}
            />
          ) : (
            <input
              type="text"
              value={currentValue.en || ''}
              onChange={(e) => handleChange('en', e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={`${inputBaseClass} ${inputClassName}`}
            />
          )}
        </div>
      </div>
    );
  }

  // Expanded view - show all languages
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {compact && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Collapse
          </button>
        )}
        {!validation.valid && validation.missing.length > 0 && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Missing: {validation.missing.map((l) => l.toUpperCase()).join(', ')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <div key={lang} className="flex items-start gap-2">
            <span
              className={`text-xs font-medium uppercase w-6 pt-2.5 ${
                requiredLanguages.includes(lang) ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {lang}
            </span>
            {multiline ? (
              <textarea
                value={currentValue[lang] || ''}
                onChange={(e) => handleChange(lang, e.target.value)}
                placeholder={`${placeholder} (${LANGUAGE_NAMES[lang]})`}
                disabled={disabled}
                rows={rows}
                className={`${inputBaseClass} ${inputClassName} ${
                  requiredLanguages.includes(lang) && !currentValue[lang]
                    ? 'border-amber-300'
                    : ''
                }`}
              />
            ) : (
              <input
                type="text"
                value={currentValue[lang] || ''}
                onChange={(e) => handleChange(lang, e.target.value)}
                placeholder={`${placeholder} (${LANGUAGE_NAMES[lang]})`}
                disabled={disabled}
                className={`${inputBaseClass} ${inputClassName} ${
                  requiredLanguages.includes(lang) && !currentValue[lang]
                    ? 'border-amber-300'
                    : ''
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
