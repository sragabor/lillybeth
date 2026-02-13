'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center';
  className?: string;
  animate?: boolean;
}

export function SectionTitle({
  title,
  subtitle,
  alignment = 'center',
  className = '',
  animate = true,
}: SectionTitleProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`
        mb-12 sm:mb-16
        ${alignment === 'center' ? 'text-center' : 'text-left'}
        ${animate ? 'transition-all duration-700' : ''}
        ${animate && !isVisible ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'}
        ${className}
      `}
    >
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`
            text-stone-500 text-lg max-w-2xl
            ${alignment === 'center' ? 'mx-auto' : ''}
            ${animate ? 'transition-all duration-700 delay-150' : ''}
            ${animate && !isVisible ? 'opacity-0' : 'opacity-100'}
          `}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
