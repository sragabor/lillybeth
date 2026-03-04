'use client';

import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface AccommodationLocationProps {
  latitude: number;
  longitude: number;
  address: string | null;
}

export function AccommodationLocation({
  latitude,
  longitude,
  address,
}: AccommodationLocationProps) {
  const { t, language } = useFrontendLanguage();
  const { ref, isVisible } = useScrollAnimation();

  // Google Maps embed with marker at the specified coordinates
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=m&z=15&output=embed`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <section className="py-16 md:py-24 px-4 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className={`
            transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-stone-800 mb-4 text-center">
            {t.accommodation.location}
          </h2>
          <p className="text-stone-600 text-center mb-8 max-w-2xl mx-auto">
            {t.map.subtitle}
          </p>

          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            {/* Map Container with grayscale filter for premium look */}
            <div className="relative aspect-[16/9] md:aspect-[21/9]">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale contrast-[1.1] hover:grayscale-0 transition-all duration-500"
              />
              {/* Subtle overlay for premium feel */}
              <div className="absolute inset-0 bg-stone-900/5 pointer-events-none" />
            </div>

            {/* Address Bar */}
            <div className="p-6 md:p-8 bg-white flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stone-100">
              {address && (
                <div className="flex items-center gap-3 text-stone-700">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-stone-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base">{address}</span>
                </div>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors shadow-sm hover:shadow-md"
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
                    strokeWidth={1.5}
                    d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                  />
                </svg>
                {t.map.getDirections}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
