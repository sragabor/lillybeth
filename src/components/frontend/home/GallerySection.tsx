'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { galleryImages, galleryConfig } from '@/config';
import { SectionTitle } from '../ui/SectionTitle';
import { Lightbox } from '../ui/Lightbox';

export function GallerySection() {
  const { t } = useFrontendLanguage();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { ref: gridRef, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Limit images shown on home page
  const displayImages = galleryImages.slice(0, galleryConfig.homePageLimit);

  // Prepare images for lightbox
  const lightboxImages = galleryImages.map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title={t.gallery.title} subtitle={t.gallery.subtitle} />

          {/* Gallery Grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {displayImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => openLightbox(index)}
                className={`
                  group relative aspect-square overflow-hidden rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2
                  transition-all duration-500 ease-out
                  ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
                `}
                style={{
                  transitionDelay: `${index * 75}ms`,
                }}
                aria-label={`View ${image.alt}`}
              >
                <Image
                  src={image.thumbnail}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Hover Overlay */}
                <div className="
                  absolute inset-0
                  bg-black/0 group-hover:bg-black/30
                  flex items-center justify-center
                  transition-all duration-300
                ">
                  <div className="
                    w-12 h-12 rounded-full
                    bg-white/90
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100
                    transform scale-75 group-hover:scale-100
                    transition-all duration-300
                  ">
                    <svg className="w-6 h-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* View All Button */}
          {galleryImages.length > galleryConfig.homePageLimit && (
            <div className="mt-12 text-center">
              <button
                onClick={() => openLightbox(0)}
                className="
                  inline-flex items-center gap-2 px-8 py-3
                  border-2 border-stone-800 text-stone-800
                  rounded-full font-medium
                  hover:bg-stone-800 hover:text-white
                  transition-all duration-300
                "
              >
                {t.gallery.viewAll}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
