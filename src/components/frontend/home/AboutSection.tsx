'use client';

import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { SectionTitle } from '../ui/SectionTitle';

export function AboutSection() {
  const { t } = useFrontendLanguage();
  const { ref: contentRef, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  // Split content into paragraphs for better formatting
  const paragraphs = t.about.content.split('\n\n').filter(Boolean);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={t.about.title} subtitle={t.about.subtitle} />

        {/* Content */}
        <div
          ref={contentRef}
          className="prose prose-lg prose-stone mx-auto text-center"
        >
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`
                text-stone-600 leading-relaxed mb-6 last:mb-0
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{
                transitionDelay: `${index * 150}ms`,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Decorative Element */}
        <div
          className={`
            mt-12 flex justify-center
            transition-all duration-700 delay-500
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-stone-300" />
            <div className="w-2 h-2 rounded-full bg-stone-400" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-stone-300" />
          </div>
        </div>
      </div>
    </section>
  );
}
