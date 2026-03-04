'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { SectionTitle } from '../ui/SectionTitle';

interface BuildingImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Building {
  id: string;
  name: Record<string, string> | string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  images: BuildingImage[];
}

export function MapSection() {
  const { t, language } = useFrontendLanguage();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuildings() {
      try {
        const response = await fetch('/api/frontend/buildings');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        // Filter buildings with coordinates
        const buildingsWithCoords = data.filter(
          (b: Building) => b.latitude && b.longitude
        );
        setBuildings(buildingsWithCoords);
        // Select first building by default
        if (buildingsWithCoords.length > 0) {
          setSelectedBuildingId(buildingsWithCoords[0].id);
        }
      } catch (err) {
        console.error('Error fetching buildings for map:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBuildings();
  }, []);

  // Get localized name - handles both plain strings and language objects
  const getLocalizedText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field['en'] || Object.values(field)[0] || '';
  };

  // Get selected building
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  // Generate Google Maps embed URL with marker for selected building
  const getMapEmbedUrl = () => {
    // If we have a selected building, show it with a labeled marker
    if (selectedBuilding?.latitude && selectedBuilding?.longitude) {
      const name = getLocalizedText(selectedBuilding.name);
      // Using the maps embed API with place name for better marker display
      return `https://maps.google.com/maps?q=${selectedBuilding.latitude},${selectedBuilding.longitude}&t=m&z=15&output=embed&iwloc=near&q=${encodeURIComponent(name)}`;
    }
    // Fallback: show first building
    const firstBuilding = buildings[0];
    if (firstBuilding?.latitude && firstBuilding?.longitude) {
      const name = getLocalizedText(firstBuilding.name);
      return `https://maps.google.com/maps?q=${firstBuilding.latitude},${firstBuilding.longitude}&t=m&z=15&output=embed&iwloc=near&q=${encodeURIComponent(name)}`;
    }
    // Default location (Lake Balaton area)
    return `https://maps.google.com/maps?q=46.85,17.85&t=m&z=11&output=embed`;
  };

  // Generate directions URL for selected building
  const getDirectionsUrl = (building: Building) => {
    if (building.latitude && building.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${building.latitude},${building.longitude}`;
    }
    return '#';
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionTitle title={t.map.title} subtitle={t.map.subtitle} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg bg-stone-100">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                </div>
              ) : (
                <iframe
                  key={selectedBuildingId}
                  src={getMapEmbedUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                  className="absolute inset-0"
                />
              )}
            </div>
          </div>

          {/* Location Info - All Accommodations */}
          <div className="space-y-4">
            <h3 className="font-birthstone text-xl text-stone-800 mb-4">
              {t.accommodation?.titlePlural || 'Our Locations'}
            </h3>

            {/* Accommodation Cards */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {buildings.map((building) => {
                const isSelected = building.id === selectedBuildingId;
                const name = getLocalizedText(building.name);
                const firstImage = building.images?.[0];

                return (
                  <div
                    key={building.id}
                    onClick={() => setSelectedBuildingId(building.id)}
                    className={`
                      group cursor-pointer rounded-xl p-4 transition-all duration-300
                      ${isSelected
                        ? 'bg-stone-800 text-white shadow-lg scale-[1.02]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      {firstImage ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={firstImage.url}
                            alt={firstImage.alt || name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white/20' : 'bg-stone-200'
                        }`}>
                          <svg className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                          {name}
                        </h4>
                        {building.address && (
                          <p className={`text-sm mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                            {building.address}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                          <a
                            href={getDirectionsUrl(building)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`
                              inline-flex items-center gap-1 text-xs font-medium
                              ${isSelected ? 'text-white/90 hover:text-white' : 'text-stone-600 hover:text-stone-800'}
                              transition-colors
                            `}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t.map.getDirections}
                          </a>
                          <Link
                            href={`/frontend/${t.routes.accommodation}/${building.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                              inline-flex items-center gap-1 text-xs font-medium
                              ${isSelected ? 'text-white/90 hover:text-white' : 'text-stone-600 hover:text-stone-800'}
                              transition-colors
                            `}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            {t.buildings.viewDetails}
                          </Link>
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {!isLoading && buildings.length === 0 && (
              <div className="text-center py-8 text-stone-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>{t.common.loading}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
