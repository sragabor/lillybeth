'use client';

import { useEffect, useState } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { BuildingCardSlider } from '../shared/BuildingCardSlider';

interface AccommodationImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Accommodation {
  id: string;
  name: Record<string, string> | string;
  slug: string;
  description: Record<string, string> | string | null;
  address: string | null;
  images: AccommodationImage[];
  minPrice: number | null;
  roomCount: number;
  totalCapacity: number;
}

interface AccommodationListPageProps {
  routeLanguage: 'en' | 'hu' | 'de';
}

export function AccommodationListPage({ routeLanguage }: AccommodationListPageProps) {
  const { t, language } = useFrontendLanguage();
  const { ref, isVisible } = useScrollAnimation();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        const response = await fetch('/api/frontend/accommodations');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setAccommodations(data);
      } catch (error) {
        console.error('Error fetching accommodations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  const getLocalizedText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field['en'] || Object.values(field)[0] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 bg-stone-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-6">
            {t.accommodation.titlePlural}
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            {t.buildings.subtitle}
          </p>
        </div>
      </section>

      {/* Accommodations Grid */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div
            ref={ref}
            className={`
              grid gap-8
              grid-cols-1
              ${accommodations.length === 1 ? 'max-w-md mx-auto' : ''}
              ${accommodations.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : ''}
              ${accommodations.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : ''}
              transition-all duration-700
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            {accommodations.map((accommodation, index) => (
              <div
                key={accommodation.id}
                className={`
                  transition-all duration-700
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <BuildingCardSlider
                  slug={accommodation.slug}
                  name={getLocalizedText(accommodation.name)}
                  description={getLocalizedText(accommodation.description)}
                  images={accommodation.images}
                  capacity={accommodation.totalCapacity}
                  index={index}
                />
              </div>
            ))}
          </div>

          {accommodations.length === 0 && (
            <div className="text-center py-16">
              <p className="text-stone-600">{t.accommodation.noRoomsAvailable}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
