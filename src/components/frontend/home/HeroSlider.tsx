'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { heroImages, heroConfig, type HeroMedia } from '@/config';

function renderBrand(text: string) {
  const parts = text.split('®');
  return parts.map((part, i) => (
    <span key={i}>{part}{i < parts.length - 1 ? <sup>®</sup> : null}</span>
  ));
}

// VideoSlide component to handle play/pause and restart
function VideoSlide({
  src,
  alt,
  isActive,
  onEnded,
}: {
  src: string;
  alt: string;
  isActive: boolean;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Reset to beginning and play when becoming active
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay might be blocked, ignore error
      });
    } else {
      // Pause when not active
      video.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      onEnded={isActive ? onEnded : undefined}
      className="absolute inset-0 w-full h-full object-cover"
      aria-label={alt}
    />
  );
}

export function HeroSlider() {
  const { t } = useFrontendLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slidesCount = heroImages.length;

  // Go to next slide
  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slidesCount);
    setTimeout(() => setIsTransitioning(false), heroConfig.transitionDuration);
  }, [slidesCount, isTransitioning]);

  // Go to previous slide
  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slidesCount) % slidesCount);
    setTimeout(() => setIsTransitioning(false), heroConfig.transitionDuration);
  }, [slidesCount, isTransitioning]);

  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), heroConfig.transitionDuration);
  }, [currentIndex, isTransitioning]);

  // Check if current slide is a video
  const currentMedia = heroImages[currentIndex];
  const isCurrentSlideVideo = currentMedia?.type === 'video';

  // Auto-play functionality (only for images, videos advance on end)
  useEffect(() => {
    if (!isAutoPlaying || heroConfig.autoPlayInterval === 0) return;
    // Skip auto-play interval for videos - they advance when they end
    if (isCurrentSlideVideo) return;

    const interval = setInterval(nextSlide, heroConfig.autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, isCurrentSlideVideo]);

  // Handle video end - advance to next slide
  const handleVideoEnded = useCallback(() => {
    nextSlide();
  }, [nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (heroConfig.pauseOnHover) {
      setIsAutoPlaying(false);
    }
  };

  const handleMouseLeave = () => {
    if (heroConfig.pauseOnHover) {
      setIsAutoPlaying(true);
    }
  };

  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Hero image slider"
    >
      {/* Slides */}
      {heroImages.map((media, index) => (
        <div
          key={media.id}
          className={`
            absolute inset-0 transition-opacity
            ${heroConfig.transitionType === 'fade' ? 'duration-700' : 'duration-500'}
            ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
          `}
          style={{
            transitionDuration: `${heroConfig.transitionDuration}ms`,
          }}
          aria-hidden={index !== currentIndex}
        >
          {/* Image or Video */}
          {media.type === 'video' ? (
            <VideoSlide
              src={media.src}
              alt={media.alt}
              isActive={index === currentIndex}
              onEnded={handleVideoEnded}
            />
          ) : (
            <Image
              src={media.src}
              alt={media.alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          )}

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-birthstone text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 tracking-wide">
            {renderBrand(t.hero.headline)}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
        </div>
      </div>

      {/* Navigation Arrows */}
      {heroConfig.showArrows && slidesCount > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="
              absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 sm:w-14 sm:h-14
              flex items-center justify-center
              bg-white/10 hover:bg-white/20 backdrop-blur-sm
              text-white rounded-full
              transition-all duration-300
              opacity-0 group-hover:opacity-100
              hover:scale-110
            "
            style={{ opacity: 0.7 }}
            aria-label={t.common.previous}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="
              absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 sm:w-14 sm:h-14
              flex items-center justify-center
              bg-white/10 hover:bg-white/20 backdrop-blur-sm
              text-white rounded-full
              transition-all duration-300
              hover:scale-110
            "
            style={{ opacity: 0.7 }}
            aria-label={t.common.next}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {heroConfig.showDots && slidesCount > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/70'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
        <button
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth',
            });
          }}
          className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors duration-300"
          aria-label={t.hero.scrollDown}
        >
          <span className="text-xs uppercase tracking-widest">{t.hero.scrollDown}</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
