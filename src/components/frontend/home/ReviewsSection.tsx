'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { SectionTitle } from '../ui/SectionTitle';

interface Review {
  id: string;
  name: string;
  title: string | null;
  text: string;
  country: string;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 flex-shrink-0 ${i < rating ? 'text-amber-400' : 'text-stone-200'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="ml-1.5 text-xs font-semibold text-amber-600">{rating}/10</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = textRef.current;
      if (el) setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, [review.text]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col gap-4 h-full relative">
      <StarRating rating={review.rating} />
      {review.title && (
        <p className="text-stone-800 font-semibold text-base">{review.title}</p>
      )}
      <p
        ref={textRef}
        className={`text-stone-600 leading-relaxed text-sm flex-1 line-clamp-5 ${isClamped ? 'cursor-default' : ''}`}
        onMouseEnter={() => isClamped && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        &ldquo;{review.text}&rdquo;
      </p>

      {hovered && (
        <div className="absolute inset-x-0 bottom-full mb-2 z-50 bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-stone-600 text-sm leading-relaxed">
          &ldquo;{review.text}&rdquo;
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">{review.name}</p>
          <p className="text-xs text-stone-400">{review.country}</p>
        </div>
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  buildingId?: string;
}

export function ReviewsSection({ buildingId }: ReviewsSectionProps) {
  const { t, language } = useFrontendLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Fetch reviews
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ language: language.toUpperCase() });
    if (buildingId) params.set('buildingId', buildingId);

    fetch(`/api/frontend/reviews?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setCurrentIndex(0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [language, buildingId]);

  // Responsive slides per view
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setSlidesPerView(3);
      else if (window.innerWidth >= 640) setSlidesPerView(2);
      else setSlidesPerView(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Clamp index when slidesPerView changes
  useEffect(() => {
    const max = Math.max(0, reviews.length - slidesPerView);
    setCurrentIndex((prev) => Math.min(prev, max));
  }, [slidesPerView, reviews.length]);

  const maxIndex = Math.max(0, reviews.length - slidesPerView);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning, maxIndex]
  );

  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Touch / drag support
  const dragStartX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = dragStartX.current - e.clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    dragStartX.current = null;
  };

  if (loading) return null;
  if (reviews.length === 0) return null;

  const total = reviews.length;
  // Track width as multiple of container
  const trackWidthPct = (total / slidesPerView) * 100;
  // Each card as fraction of track
  const cardWidthPct = 100 / total;
  // Translate amount per step
  const translatePct = (currentIndex / total) * 100;

  // Number of "page" dots
  const totalDots = Math.max(1, maxIndex + 1);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={t.reviews.title}
          subtitle={t.reviews.subtitle}
        />

        <div className="relative">
          {/* Overflow container */}
          <div
            className="overflow-visible cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {/* Sliding track */}
            <div
              ref={trackRef}
              className="flex"
              style={{
                width: `${trackWidthPct}%`,
                transform: `translateX(-${translatePct}%)`,
                transition: isTransitioning ? 'transform 400ms ease' : 'transform 400ms ease',
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{ width: `${cardWidthPct}%` }}
                  className="px-3"
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {/* Prev arrow */}
          {currentIndex > 0 && (
            <button
              onClick={prev}
              className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-stone-100 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:shadow-lg transition-all duration-200"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {currentIndex < maxIndex && (
            <button
              onClick={next}
              className="absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-stone-100 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:shadow-lg transition-all duration-200"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {totalDots > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalDots }, (_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-stone-800 w-6 h-2'
                    : 'bg-stone-300 hover:bg-stone-400 w-2 h-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
