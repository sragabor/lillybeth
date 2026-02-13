import {
  HeroSlider,
  SearchSection,
  BuildingsSection,
  AboutSection,
  GallerySection,
  MapSection,
} from '@/components/frontend/home';

export default function FrontendHomePage() {
  return (
    <>
      {/* Hero Section with full-screen image slider */}
      <HeroSlider />

      {/* Search Section - overlaps hero */}
      <SearchSection />

      {/* Buildings Section - displays properties from admin */}
      <BuildingsSection />

      {/* About Section - static content from /contents */}
      <AboutSection />

      {/* Gallery Section - image grid with lightbox */}
      <GallerySection />

      {/* Map Section - location with Google Maps */}
      <MapSection />
    </>
  );
}
