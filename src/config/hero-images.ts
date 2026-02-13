/**
 * Hero Slider Images Configuration
 *
 * INSTRUCTIONS FOR REPLACING IMAGES:
 * 1. Upload images to your hosting (Vercel Blob, Cloudinary, etc.)
 * 2. Replace the `src` URLs below with your image URLs
 * 3. Update `alt` text to describe each image accurately
 * 4. Recommended image size: 1920x1080 or larger (16:9 ratio)
 * 5. Use WebP or optimized JPG for best performance
 *
 * The images are loaded in order - first image appears first in slider.
 */

export interface HeroImage {
  id: string;
  src: string;
  alt: string;
  /**
   * Optional: Different image for mobile (smaller file size)
   * If not provided, main `src` will be used
   */
  mobileSrc?: string;
}

export const heroImages: HeroImage[] = [
  {
    id: 'hero-1',
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop',
    alt: 'Luxury villa exterior with pool at sunset',
    mobileSrc: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'hero-2',
    src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1920&auto=format&fit=crop',
    alt: 'Elegant bedroom with natural light',
    mobileSrc: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'hero-3',
    src: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1920&auto=format&fit=crop',
    alt: 'Serene garden view from terrace',
    mobileSrc: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'hero-4',
    src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1920&auto=format&fit=crop',
    alt: 'Resort pool area surrounded by nature',
    mobileSrc: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800&auto=format&fit=crop',
  },
];

/**
 * Hero slider configuration
 */
export const heroConfig = {
  /**
   * Auto-play interval in milliseconds
   * Set to 0 to disable auto-play
   */
  autoPlayInterval: 5000,

  /**
   * Transition duration in milliseconds
   */
  transitionDuration: 700,

  /**
   * Transition type: 'fade' | 'slide'
   */
  transitionType: 'fade' as const,

  /**
   * Show navigation arrows
   */
  showArrows: true,

  /**
   * Show dot indicators
   */
  showDots: true,

  /**
   * Pause auto-play on hover
   */
  pauseOnHover: true,
};
