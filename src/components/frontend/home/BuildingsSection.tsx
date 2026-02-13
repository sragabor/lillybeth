'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { SectionTitle } from '../ui/SectionTitle';
import { BuildingCard } from '../shared/BuildingCard';

interface BuildingImage {
  id: string;
  url: string;
  order: number;
}

interface Building {
  id: string;
  name: Record<string, string> | string;
  slug: string;
  description: Record<string, string> | string | null;
  images: BuildingImage[];
}

export function BuildingsSection() {
  const { t, language } = useFrontendLanguage();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuildings() {
      try {
        const response = await fetch('/api/frontend/buildings');
        if (!response.ok) {
          throw new Error('Failed to fetch buildings');
        }
        const data = await response.json();
        // Ensure we have an array
        if (Array.isArray(data)) {
          setBuildings(data);
        } else {
          console.error('Buildings API did not return an array:', data);
          setError('Invalid data format');
        }
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError('Failed to load buildings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBuildings();
  }, []);

  // Helper to get localized text with fallback
  // Handles both plain strings and language objects
  const getLocalizedText = (
    field: Record<string, string> | string | null | undefined
  ): string => {
    if (!field) return '';
    // If it's already a plain string, return it directly
    if (typeof field === 'string') return field;
    // Otherwise treat as language object
    return field[language] || field['en'] || Object.values(field)[0] || '';
  };

  // Get first image URL for a building
  const getFirstImage = (images: BuildingImage[]): string | null => {
    if (!images || images.length === 0) return null;
    const sorted = [...images].sort((a, b) => a.order - b.order);
    return sorted[0]?.url || null;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title={t.buildings.title} subtitle={t.buildings.subtitle} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-200" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-stone-500">{t.common.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-stone-700 underline hover:no-underline"
          >
            {t.common.tryAgain}
          </button>
        </div>
      </section>
    );
  }

  // No buildings
  if (buildings.length === 0) {
    return null;
  }

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        <SectionTitle title={t.buildings.title} subtitle={t.buildings.subtitle} />

        {/* Buildings Grid - adapts to number of items */}
        <div
          className={`
            grid gap-6 sm:gap-8
            ${
              buildings.length === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : buildings.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }
          `}
        >
          {buildings.map((building, index) => (
            <BuildingCard
              key={building.id}
              id={building.id}
              slug={building.slug}
              name={getLocalizedText(building.name)}
              image={getFirstImage(building.images)}
              description={getLocalizedText(building.description)}
              index={index}
            />
          ))}
        </div>

        {/* View All Button */}
        {buildings.length > 3 && (
          <div className="mt-12 text-center">
            <Link
              href={`/frontend/${t.routes.accommodation}`}
              className="
                inline-flex items-center gap-2 px-8 py-3
                border-2 border-stone-800 text-stone-800
                rounded-full font-medium
                hover:bg-stone-800 hover:text-white
                transition-all duration-300
              "
            >
              {t.buildings.viewAll}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
