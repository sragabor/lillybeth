'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useBookingCart } from '@/contexts/BookingCartContext';

interface RoomTypeImage {
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
  availableRooms: number;
  images: RoomTypeImage[];
  amenityCategories: AmenityCategory[];
}

interface SearchResultRoomTypeCardProps {
  roomType: RoomType;
  accommodationId: string;
  accommodationName: string;
  accommodationAmenities: Amenity[];
  getLocalizedText: (field: Record<string, string> | string | null | undefined) => string;
  index: number;
  checkIn: string | null;
  checkOut: string | null;
}

const INITIAL_AMENITIES_COUNT = 10;

export function SearchResultRoomTypeCard({
  roomType,
  accommodationId,
  accommodationName,
  accommodationAmenities,
  getLocalizedText,
  index,
  checkIn,
  checkOut,
}: SearchResultRoomTypeCardProps) {
  const { t } = useFrontendLanguage();
  const { addOrUpdateItem, getItemQuantity, setDates } = useBookingCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const name = getLocalizedText(roomType.name);
  const description = getLocalizedText(roomType.description);
  const quantity = getItemQuantity(roomType.id);
  const availableRooms = roomType.availableRooms ?? 0;

  // Merge room type amenities with accommodation amenities
  const roomTypeAmenities = roomType.amenityCategories.flatMap((cat) => cat.amenities);
  const allAmenities = [...roomTypeAmenities, ...accommodationAmenities];

  // Remove duplicates by id
  const uniqueAmenities = allAmenities.filter(
    (amenity, idx, self) => self.findIndex((a) => a.id === amenity.id) === idx
  );

  const displayAmenities = showAllAmenities
    ? uniqueAmenities
    : uniqueAmenities.slice(0, INITIAL_AMENITIES_COUNT);
  const hasMoreAmenities = uniqueAmenities.length > INITIAL_AMENITIES_COUNT;

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

  // Quantity handlers
  const handleQuantityChange = (newQuantity: number) => {
    const clampedQuantity = Math.max(0, Math.min(newQuantity, availableRooms));

    // Set dates in cart when adding items
    if (clampedQuantity > 0 && checkIn && checkOut) {
      setDates(checkIn, checkOut);
    }

    addOrUpdateItem({
      roomTypeId: roomType.id,
      roomTypeName: name,
      accommodationId,
      accommodationName,
      quantity: clampedQuantity,
      pricePerNight: roomType.minPrice,
      capacity: roomType.capacity,
      // guestCounts will be initialized by context with capacity as default
    });
  };

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Mobile: Stacked layout, Desktop: Image left, content right */}
      <div className="flex flex-col lg:flex-row">
        {/* Image Slider */}
        <div
          ref={sliderRef}
          className="relative aspect-[4/3] lg:aspect-auto lg:w-2/5 lg:min-h-[360px] group select-none overflow-hidden"
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
                {roomType.images.map((image) => (
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
                    className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
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
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
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

              {/* Available rooms badge */}
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
                <span className="text-sm font-medium text-stone-700">
                  {availableRooms} {availableRooms === 1 ? 'room' : 'rooms'}
                </span>
              </div>
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
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-xl lg:text-2xl font-serif font-semibold text-stone-800">
              {name}
            </h3>
            {/* Prominent capacity badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 text-white rounded-full text-sm font-medium flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{t.common.max} {roomType.capacity}</span>
            </div>
          </div>

          {description && (
            <p className="text-stone-600 mb-4 line-clamp-3">
              {description}
            </p>
          )}

          {/* Amenities */}
          {displayAmenities.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {displayAmenities.map((amenity) => (
                  <span
                    key={amenity.id}
                    className="px-3 py-1.5 bg-stone-100 text-stone-600 text-xs rounded-full"
                  >
                    {getLocalizedText(amenity.name)}
                  </span>
                ))}
                {hasMoreAmenities && !showAllAmenities && (
                  <button
                    onClick={() => setShowAllAmenities(true)}
                    className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs rounded-full hover:bg-stone-300 transition-colors"
                  >
                    +{uniqueAmenities.length - INITIAL_AMENITIES_COUNT} more
                  </button>
                )}
                {showAllAmenities && hasMoreAmenities && (
                  <button
                    onClick={() => setShowAllAmenities(false)}
                    className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs rounded-full hover:bg-stone-300 transition-colors"
                  >
                    {t.accommodation.showLess}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price and Quantity Selector */}
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

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 0}
                className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  quantity <= 0
                    ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
                aria-label="Decrease quantity"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>

              <div className="w-12 text-center">
                <span className="text-xl font-semibold text-stone-800">{quantity}</span>
              </div>

              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= availableRooms}
                className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  quantity >= availableRooms
                    ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    : 'bg-stone-800 text-white hover:bg-stone-700'
                }`}
                aria-label="Increase quantity"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
