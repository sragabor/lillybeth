'use client';

import { useState, useEffect } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

interface FloatingBookButtonProps {
  accommodationId: string;
}

export function FloatingBookButton({ accommodationId }: FloatingBookButtonProps) {
  const { t } = useFrontendLanguage();
  const [isVisible, setIsVisible] = useState(false);

  // Show button after scrolling past the hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const showThreshold = 400; // Show after scrolling 400px

      setIsVisible(scrollY > showThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    // Scroll to booking search section
    const bookingSection = document.getElementById('booking-search');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback: navigate to booking page
      window.location.href = `/frontend/booking?accommodation=${accommodationId}`;
    }
  };

  return (
    <>
      {/* Desktop Floating Button */}
      <button
        onClick={handleClick}
        className={`
          hidden md:flex fixed bottom-8 right-8 z-40
          items-center gap-2 px-6 py-3
          bg-stone-800 text-white rounded-full shadow-lg
          font-medium transition-all duration-300
          hover:bg-stone-700 hover:shadow-xl hover:scale-105
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
        `}
        aria-label={t.header.bookNow}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {t.header.bookNow}
      </button>

      {/* Mobile Sticky Button */}
      <div
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-40
          p-4 bg-white/95 backdrop-blur-sm border-t border-stone-100 shadow-lg
          transition-transform duration-300
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <button
          onClick={handleClick}
          className="w-full py-4 bg-stone-800 text-white rounded-xl font-medium text-lg hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {t.header.bookNow}
        </button>
      </div>
    </>
  );
}
