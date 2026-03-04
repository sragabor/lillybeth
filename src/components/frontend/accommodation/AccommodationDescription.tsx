'use client';

import { useState, useRef, useEffect } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface AccommodationDescriptionProps {
  description: string;
}

const COLLAPSED_HEIGHT = 200; // Height in pixels before collapsing

export function AccommodationDescription({ description }: AccommodationDescriptionProps) {
  const { t } = useFrontendLanguage();
  const { ref, isVisible } = useScrollAnimation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setNeedsCollapse(contentHeight > COLLAPSED_HEIGHT);
    }
  }, [description]);

  if (!description) return null;

  // Split description into paragraphs
  const paragraphs = description.split('\n').filter((p) => p.trim());

  return (
    <section className="py-16 md:py-24 px-4">
      <div
        ref={ref}
        className={`
          max-w-3xl mx-auto
          transition-all duration-700
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <h2 className="text-2xl md:text-3xl font-birthstone font-semibold text-stone-800 mb-8 text-center">
          {t.accommodation.description}
        </h2>

        <div className="relative">
          <div
            ref={contentRef}
            className={`
              prose prose-stone prose-lg max-w-none overflow-hidden transition-all duration-500
              ${!isExpanded && needsCollapse ? 'max-h-[200px]' : 'max-h-[2000px]'}
            `}
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-stone-600 leading-relaxed mb-4 last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Gradient fade overlay when collapsed */}
          {needsCollapse && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>

        {/* Show more/less button */}
        {needsCollapse && (
          <div className="text-center mt-6">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 border border-stone-200 rounded-full hover:border-stone-300 transition-all duration-300"
            >
              {isExpanded ? t.accommodation.showLess : t.accommodation.showMore}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
