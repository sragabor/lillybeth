'use client';

import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { RoomTypeCard } from './RoomTypeCard';

interface AccommodationImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Amenity {
  id: string;
  name: Record<string, string> | string;
  icon: string | null;
}

interface AmenityCategory {
  id: string;
  name: Record<string, string> | string;
  amenities: Amenity[];
}

interface RoomType {
  id: string;
  name: Record<string, string> | string;
  description: Record<string, string> | string | null;
  capacity: number;
  minPrice: number | null;
  images: AccommodationImage[];
  amenityCategories: AmenityCategory[];
}

interface RoomTypesSectionProps {
  roomTypes: RoomType[];
  accommodationId: string;
  accommodationName: string;
  accommodationAmenities: Amenity[];
  getLocalizedText: (field: Record<string, string> | string | null | undefined) => string;
}

export function RoomTypesSection({
  roomTypes,
  accommodationId,
  accommodationName,
  accommodationAmenities,
  getLocalizedText,
}: RoomTypesSectionProps) {
  const { t } = useFrontendLanguage();
  const { ref, isVisible } = useScrollAnimation();

  if (roomTypes.length === 0) {
    return (
      <section className="py-16 md:py-24 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-stone-600">{t.accommodation.noRoomsAvailable}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="room-types" className="py-16 md:py-24 px-4 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className={`
            text-center mb-12
            transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <h2 className="text-2xl md:text-3xl font-birthstone font-semibold text-stone-800 mb-4">
            {t.accommodation.roomTypes}
          </h2>
        </div>

        {/* Vertical list layout */}
        <div className="space-y-8">
          {roomTypes.map((roomType, index) => (
            <RoomTypeCard
              key={roomType.id}
              roomType={roomType}
              accommodationId={accommodationId}
              accommodationName={accommodationName}
              accommodationAmenities={accommodationAmenities}
              getLocalizedText={getLocalizedText}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
