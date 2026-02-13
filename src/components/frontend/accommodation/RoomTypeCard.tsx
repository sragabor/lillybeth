'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

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

interface RoomTypeCardProps {
  roomType: RoomType;
  accommodationId: string;
  getLocalizedText: (field: Record<string, string> | string | null | undefined) => string;
  index: number;
  isVisible: boolean;
}

export function RoomTypeCard({
  roomType,
  accommodationId,
  getLocalizedText,
  index,
  isVisible,
}: RoomTypeCardProps) {
  const { t } = useFrontendLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const name = getLocalizedText(roomType.name);
  const description = getLocalizedText(roomType.description);

  // Get first few amenities to display
  const allAmenities = roomType.amenityCategories.flatMap((cat) => cat.amenities);
  const displayAmenities = allAmenities.slice(0, 6);

  const goToNextImage = () => {
    if (roomType.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % roomType.images.length);
    }
  };

  const goToPrevImage = () => {
    if (roomType.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + roomType.images.length) % roomType.images.length);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - dragStartX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 50;
    if (dragOffset > threshold) goToPrevImage();
    else if (dragOffset < -threshold) goToNextImage();
    setDragOffset(0);
  };

  // Format capacity text
  const capacityText = roomType.capacity === 1
    ? t.accommodation.capacitySingular
    : t.accommodation.capacity.replace('{count}', roomType.capacity.toString());

  return (
    <div
      className={`
        bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg
        transition-all duration-500
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Mobile: Stacked layout, Desktop: Image left, content right */}
      <div className="flex flex-col lg:flex-row">
        {/* Image Slider */}
        <div
          ref={sliderRef}
          className="relative aspect-[4/3] lg:aspect-auto lg:w-2/5 lg:min-h-[320px] group select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {roomType.images.length > 0 ? (
            <>
              <div
                className="flex h-full transition-transform duration-300"
                style={{
                  transform: `translateX(calc(-${currentImageIndex * 100}% + ${isDragging ? dragOffset : 0}px))`,
                  transition: isDragging ? 'none' : 'transform 300ms ease-out',
                }}
              >
                {roomType.images.map((image, idx) => (
                  <div key={image.id} className="relative w-full h-full flex-shrink-0">
                    <Image
                      src={image.url}
                      alt={image.alt || name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                ))}
              </div>

              {/* Navigation arrows */}
              {roomType.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToPrevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
                    aria-label={t.common.previous}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToNextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
                    aria-label={t.common.next}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {roomType.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-stone-200 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col">
          <h3 className="text-xl lg:text-2xl font-serif font-semibold text-stone-800 mb-3">
            {name}
          </h3>

          {description && (
            <p className="text-stone-600 mb-4 line-clamp-3">
              {description}
            </p>
          )}

          {/* Capacity */}
          <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <span>{capacityText}</span>
          </div>

          {/* Amenities */}
          {displayAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {displayAmenities.map((amenity) => (
                <span
                  key={amenity.id}
                  className="px-3 py-1.5 bg-stone-100 text-stone-600 text-xs rounded-full"
                >
                  {getLocalizedText(amenity.name)}
                </span>
              ))}
              {allAmenities.length > 6 && (
                <span className="px-3 py-1.5 bg-stone-100 text-stone-600 text-xs rounded-full">
                  +{allAmenities.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price and CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-stone-100">
            {roomType.minPrice ? (
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-wide">{t.accommodation.fromPrice}</span>
                <div className="text-2xl font-semibold text-stone-800">
                  €{roomType.minPrice}
                  <span className="text-sm font-normal text-stone-500 ml-1">
                    {t.accommodation.perNight}
                  </span>
                </div>
              </div>
            ) : (
              <div />
            )}

            <Link
              href={`/frontend/booking?accommodation=${accommodationId}&room=${roomType.id}`}
              className="w-full sm:w-auto px-6 py-3 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors text-center shadow-sm hover:shadow-md"
            >
              {t.accommodation.bookThisRoom}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
