'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

interface BuildingImage {
  id: string;
  url: string;
  alt: string | null;
}

interface BuildingCardSliderProps {
  slug: string;
  name: string;
  description?: string;
  images: BuildingImage[];
  capacity?: number;
  address?: string;
  roomCount?: number;
  index?: number;
  maxImages?: number;
}

export function BuildingCardSlider({
  slug,
  name,
  description,
  images,
  capacity,
  address,
  roomCount,
  index = 0,
  maxImages = 10,
}: BuildingCardSliderProps) {
  const { t } = useFrontendLanguage();

  // Limit images to maxImages
  const displayImages = images.slice(0, maxImages);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const totalSlides = displayImages.length + 1; // Images + CTA slide

  const goToSlide = useCallback((index: number) => {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = totalSlides - 1;
    setCurrentSlide(index);
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    }
    setDragOffset(0);
  };

  // Mouse handlers for drag on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    }
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  // Format capacity text
  const getCapacityText = () => {
    if (!capacity) return null;
    if (capacity === 1) return t.buildings.capacitySingular;
    return t.buildings.capacity.replace('{count}', capacity.toString());
  };

  const delay = index * 100;

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Slider Container */}
      <div
        ref={sliderRef}
        className="relative aspect-[4/3] overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Slides Track */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(-${currentSlide * 100}% + ${isDragging ? dragOffset : 0}px))`,
            transition: isDragging ? 'none' : 'transform 300ms ease-out',
          }}
        >
          {/* Image Slides */}
          {displayImages.map((image, idx) => (
            <div key={image.id} className="relative w-full h-full flex-shrink-0">
              <Image
                src={image.url}
                alt={image.alt || `${name} - ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={index < 3 && idx === 0}
              />
            </div>
          ))}

          {/* CTA Slide */}
          <div className="relative w-full h-full flex-shrink-0 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
            <Link
              href={`/frontend/${t.routes.accommodation}/${slug}`}
              className="flex flex-col items-center gap-4 text-white px-8 py-6 group/cta"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-2xl font-serif">{name}</span>
              <span className="px-6 py-3 bg-white text-stone-800 rounded-full font-medium text-sm transition-all duration-300 group-hover/cta:bg-stone-100 group-hover/cta:scale-105">
                {t.buildings.learnMore}
              </span>
              <svg
                className="w-6 h-6 opacity-60 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Navigation Arrows */}
        {currentSlide > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
            aria-label={t.common.previous}
          >
            <svg className="w-4 h-4 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {currentSlide < totalSlides - 1 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
            aria-label={t.common.next}
          >
            <svg className="w-4 h-4 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Slide Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {Array.from({ length: Math.min(totalSlides, 8) }).map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'bg-white w-4'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          {totalSlides > 8 && (
            <span className="text-white/70 text-xs ml-1">+{totalSlides - 8}</span>
          )}
        </div>

        {/* Image counter badge */}
        {displayImages.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {currentSlide + 1} / {totalSlides}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <Link href={`/frontend/${t.routes.accommodation}/${slug}`}>
          <h3 className="font-serif text-xl text-stone-800 group-hover:text-stone-600 transition-colors duration-300">
            {name}
          </h3>
        </Link>

        {/* Address */}
        {address && (
          <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{address}</span>
          </div>
        )}

        {/* Key Info Row */}
        <div className="flex items-center gap-4 mt-3">
          {/* Capacity */}
          {capacity && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>{getCapacityText()}</span>
            </div>
          )}

          {/* Room Count */}
          {roomCount && roomCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              <span>{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-3 text-stone-500 text-sm line-clamp-2">
            {description}
          </p>
        )}

        {/* View Details Link */}
        <Link
          href={`/frontend/${t.routes.accommodation}/${slug}`}
          className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
        >
          {t.buildings.viewDetails}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
