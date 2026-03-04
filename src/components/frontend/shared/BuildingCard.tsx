'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

interface BuildingCardProps {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description?: string;
  index?: number; // For stagger animation
}

export function BuildingCard({
  id,
  slug,
  name,
  image,
  description,
  index = 0,
}: BuildingCardProps) {
  const { t } = useFrontendLanguage();

  // Calculate stagger delay
  const delay = index * 100;

  return (
    <Link
      href={`/frontend/${t.routes.accommodation}/${slug}`}
      className="
        group block
        bg-white rounded-2xl overflow-hidden
        shadow-sm hover:shadow-2xl
        transition-all duration-500 ease-out
        transform hover:-translate-y-2
      "
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-stone-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        )}

        {/* Gradient Overlay - always present but subtle, more visible on hover */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-black/70 via-black/20 to-transparent
            opacity-40 group-hover:opacity-100
            transition-opacity duration-500
          "
        />

        {/* View Details Button */}
        <div
          className="
            absolute inset-0 flex items-end justify-center pb-6
            opacity-0 group-hover:opacity-100
            transition-all duration-500 ease-out
            transform translate-y-4 group-hover:translate-y-0
          "
        >
          <span
            className="
              px-6 py-2.5 bg-white text-stone-800 text-sm font-medium rounded-full
              shadow-lg transform scale-90 group-hover:scale-100
              transition-transform duration-300
            "
          >
            {t.buildings.viewDetails}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3
          className="
            font-serif text-xl text-stone-800
            group-hover:text-stone-600
            transition-colors duration-300
          "
        >
          {name}
        </h3>
        {description && (
          <p
            className="
              mt-2 text-stone-500 text-sm line-clamp-2
              transition-colors duration-300
              group-hover:text-stone-600
            "
          >
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
