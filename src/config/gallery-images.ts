/**
 * Gallery Images Configuration (MOCK DATA)
 *
 * NOTE: This is temporary mock data.
 * In production, gallery images will come from the Website Admin backend.
 *
 * INSTRUCTIONS FOR REPLACING:
 * 1. Once the admin gallery upload feature is implemented,
 *    this file can be removed
 * 2. Gallery component will fetch from API instead
 */

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  thumbnail: string;
  /**
   * Optional category for filtering (future feature)
   */
  category?: 'exterior' | 'interior' | 'amenities' | 'surroundings';
}

export const galleryImages: GalleryImage[] = [
  {
    id: 'gallery-1',
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
    alt: 'Villa exterior view',
    category: 'exterior',
  },
  {
    id: 'gallery-2',
    src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=400&auto=format&fit=crop',
    alt: 'Elegant master bedroom',
    category: 'interior',
  },
  {
    id: 'gallery-3',
    src: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=400&auto=format&fit=crop',
    alt: 'Hotel pool at dusk',
    category: 'amenities',
  },
  {
    id: 'gallery-4',
    src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=400&auto=format&fit=crop',
    alt: 'Resort infinity pool',
    category: 'amenities',
  },
  {
    id: 'gallery-5',
    src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=400&auto=format&fit=crop',
    alt: 'Cozy living room',
    category: 'interior',
  },
  {
    id: 'gallery-6',
    src: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=400&auto=format&fit=crop',
    alt: 'Modern bathroom',
    category: 'interior',
  },
  {
    id: 'gallery-7',
    src: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=400&auto=format&fit=crop',
    alt: 'Hotel lobby',
    category: 'interior',
  },
  {
    id: 'gallery-8',
    src: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=400&auto=format&fit=crop',
    alt: 'Garden pathway',
    category: 'surroundings',
  },
];

/**
 * Gallery configuration
 */
export const galleryConfig = {
  /**
   * Number of images to show on home page
   */
  homePageLimit: 8,

  /**
   * Grid columns on different breakpoints
   */
  gridCols: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  },
};
