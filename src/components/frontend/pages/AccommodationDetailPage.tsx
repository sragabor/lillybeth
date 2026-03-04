'use client';

import { useEffect, useState } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { AccommodationHeroSlider } from '@/components/frontend/accommodation/AccommodationHeroSlider';
import { AccommodationBookingSearch } from '@/components/frontend/accommodation/AccommodationBookingSearch';
import { AccommodationDescription } from '@/components/frontend/accommodation/AccommodationDescription';
import { AccommodationGallery } from '@/components/frontend/accommodation/AccommodationGallery';
import { AccommodationAmenities } from '@/components/frontend/accommodation/AccommodationAmenities';
import { AccommodationRules } from '@/components/frontend/accommodation/AccommodationRules';
import { AccommodationLocation } from '@/components/frontend/accommodation/AccommodationLocation';
import { RoomTypesSection } from '@/components/frontend/accommodation/RoomTypesSection';
import { BookingCart } from '@/components/frontend/accommodation/BookingCart';
import Link from 'next/link';

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

interface HouseRule {
  id: string;
  rule: Record<string, string> | string;
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

interface Accommodation {
  id: string;
  name: Record<string, string> | string;
  slug: string;
  description: Record<string, string> | string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cancellationPolicy: Record<string, string> | string | null;
  paymentMethods: Record<string, string> | string | null;
  depositInfo: Record<string, string> | string | null;
  images: AccommodationImage[];
  amenityCategories: AmenityCategory[];
  houseRules: HouseRule[];
  roomTypes: RoomType[];
}

interface AccommodationDetailPageProps {
  slug: string;
  routeLanguage: 'en' | 'hu' | 'de';
}

export function AccommodationDetailPage({ slug, routeLanguage }: AccommodationDetailPageProps) {
  const { t, language } = useFrontendLanguage();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccommodation = async () => {
      try {
        setLoading(true);
        // Fetch accommodation by slug (same slug for all languages)
        const response = await fetch(`/api/frontend/accommodations/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('not_found');
          } else {
            throw new Error('Failed to fetch');
          }
          return;
        }
        const data = await response.json();
        setAccommodation(data);
      } catch (err) {
        console.error('Error fetching accommodation:', err);
        setError('error');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchAccommodation();
    }
  }, [slug, routeLanguage]);

  // Helper to get localized text
  const getLocalizedText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field['en'] || Object.values(field)[0] || '';
  };

  // Get the back link based on route language
  const getBackLink = () => {
    const routes: Record<string, string> = {
      en: '/frontend/accommodation',
      hu: '/frontend/szallas',
      de: '/frontend/unterkunft',
    };
    return routes[routeLanguage] || routes.en;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error === 'not_found' || !accommodation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-birthstone text-stone-800 mb-4">
            {t.accommodation.title} {t.common.error.toLowerCase()}
          </h1>
          <p className="text-stone-600 mb-8">
            The accommodation you&apos;re looking for could not be found.
          </p>
          <Link
            href={getBackLink()}
            className="inline-block px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            {t.accommodation.backToAccommodations}
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-birthstone text-stone-800 mb-4">{t.common.error}</h1>
          <p className="text-stone-600 mb-8">
            Something went wrong while loading this page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            {t.common.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  const accommodationName = getLocalizedText(accommodation.name);

  // Use the single slug (same for all languages)
  const currentSlug = accommodation.slug || slug;

  // Calculate total capacity from room types
  const totalCapacity = accommodation.roomTypes.reduce((sum, rt) => sum + rt.capacity, 0);

  // Get a short highlight text from description (first sentence or first 100 chars)
  const fullDescription = getLocalizedText(accommodation.description);
  const highlightText = fullDescription
    ? fullDescription.split('.')[0] + (fullDescription.includes('.') ? '.' : '')
    : undefined;

  return (
    <>
      {/* Hero Slider with overlay content */}
      <AccommodationHeroSlider
        images={accommodation.images}
        title={accommodationName}
        address={accommodation.address}
        capacity={totalCapacity}
        highlightText={highlightText && highlightText.length <= 150 ? highlightText : undefined}
      />

      {/* Booking Search - overlaps hero */}
      <AccommodationBookingSearch
        accommodationId={accommodation.id}
        accommodationSlug={currentSlug}
      />

      {/* Description with collapsible content */}
      <AccommodationDescription
        description={getLocalizedText(accommodation.description)}
      />

      {/* Gallery */}
      {accommodation.images.length > 0 && (
        <AccommodationGallery images={accommodation.images} />
      )}

      {/* Amenities with collapsible content */}
      {accommodation.amenityCategories.length > 0 && (
        <AccommodationAmenities
          amenityCategories={accommodation.amenityCategories}
          getLocalizedText={getLocalizedText}
        />
      )}

      {/* House Rules & Booking Conditions */}
      <AccommodationRules
        houseRules={accommodation.houseRules}
        cancellationPolicy={getLocalizedText(accommodation.cancellationPolicy)}
        paymentMethods={getLocalizedText(accommodation.paymentMethods)}
        depositInfo={getLocalizedText(accommodation.depositInfo)}
        getLocalizedText={getLocalizedText}
      />

      {/* Room Types - vertical list with image left layout */}
      {accommodation.roomTypes.length > 0 && (
        <RoomTypesSection
          roomTypes={accommodation.roomTypes}
          accommodationId={accommodation.id}
          accommodationName={accommodationName}
          accommodationAmenities={accommodation.amenityCategories.flatMap((cat) => cat.amenities)}
          getLocalizedText={getLocalizedText}
        />
      )}

      {/* Location with premium map styling */}
      {(accommodation.latitude && accommodation.longitude) && (
        <AccommodationLocation
          latitude={accommodation.latitude}
          longitude={accommodation.longitude}
          address={accommodation.address}
        />
      )}

      {/* Booking Cart */}
      <BookingCart />
    </>
  );
}
