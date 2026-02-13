'use client';

import { useEffect, useState } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { siteConfig } from '@/config';
import { SectionTitle } from '../ui/SectionTitle';

interface Building {
  id: string;
  name: Record<string, string> | string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export function MapSection() {
  const { t, language } = useFrontendLanguage();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Calculate map center based on buildings or use default
  const getMapCenter = () => {
    if (buildings.length === 0) {
      return siteConfig.maps.defaultCenter;
    }

    const validBuildings = buildings.filter(
      (b) => b.latitude !== null && b.longitude !== null
    );

    if (validBuildings.length === 0) {
      return siteConfig.maps.defaultCenter;
    }

    const avgLat =
      validBuildings.reduce((sum, b) => sum + (b.latitude || 0), 0) /
      validBuildings.length;
    const avgLng =
      validBuildings.reduce((sum, b) => sum + (b.longitude || 0), 0) /
      validBuildings.length;

    return { lat: avgLat, lng: avgLng };
  };

  // Generate Google Maps embed URL
  const getMapEmbedUrl = () => {
    const center = getMapCenter();

    // If we have buildings with coords, create markers
    if (buildings.length > 0) {
      // Use the first building for the embed center
      const firstBuilding = buildings[0];
      if (firstBuilding.latitude && firstBuilding.longitude) {
        return `https://www.google.com/maps/embed/v1/place?key=${siteConfig.maps.apiKey}&q=${firstBuilding.latitude},${firstBuilding.longitude}&zoom=${siteConfig.maps.defaultZoom}`;
      }
    }

    // Fallback to embed without API key using iframe embed
    return `https://www.google.com/maps?q=${center.lat},${center.lng}&z=${siteConfig.maps.defaultZoom}&output=embed`;
  };

  // Generate directions URL
  const getDirectionsUrl = () => {
    const center = getMapCenter();
    return `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
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

          {/* Location Info */}
          <div className="space-y-6">
            {/* Address Card */}
            <div className="bg-stone-50 rounded-2xl p-6">
              <h3 className="font-serif text-xl text-stone-800 mb-4">
                {t.footer.address.title}
              </h3>
              <address className="not-italic text-stone-600 leading-relaxed">
                {siteConfig.address.street}<br />
                {siteConfig.address.postalCode} {siteConfig.address.city}<br />
                {siteConfig.address.country}
              </address>

              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center gap-2 mt-4
                  text-stone-800 font-medium
                  hover:text-stone-600
                  transition-colors duration-200
                "
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.map.getDirections}
              </a>
            </div>

            {/* Buildings List */}
            {buildings.length > 0 && (
              <div className="bg-stone-50 rounded-2xl p-6">
                <h3 className="font-serif text-xl text-stone-800 mb-4">
                  {t.buildings.title}
                </h3>
                <ul className="space-y-3">
                  {buildings.map((building) => (
                    <li key={building.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-stone-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="text-stone-700 font-medium">
                          {getLocalizedText(building.name)}
                        </span>
                        {building.address && (
                          <p className="text-stone-500 text-sm mt-0.5">
                            {building.address}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
