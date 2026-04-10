import { Metadata } from 'next';
import {
  HeroSlider,
  SearchSection,
  BuildingsSection,
  AboutSection,
  GallerySection,
  MapSection,
  ReviewsSection,
} from '@/components/frontend/home';
import { JsonLd } from '@/components/frontend/seo/JsonLd';
import { siteConfig } from '@/config';
import { seoConfig } from '@/config/seo';

const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  title: seoConfig.home.en.title,
  description: seoConfig.home.en.description,
  keywords: seoConfig.home.en.keywords,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteUrl}/frontend`,
    languages: {
      en: `${siteUrl}/frontend`,
      hu: `${siteUrl}/frontend`,
      de: `${siteUrl}/frontend`,
      'x-default': `${siteUrl}/frontend`,
    },
  },
  openGraph: {
    title: seoConfig.home.en.title,
    description: seoConfig.home.en.description,
    url: `${siteUrl}/frontend`,
    type: 'website',
    images: [{ url: `${siteUrl}/lillybeth-logo.png`, width: 400, height: 400 }],
  },
  twitter: {
    card: 'summary',
    title: seoConfig.home.en.title,
    description: seoConfig.home.en.description,
    images: [`${siteUrl}/lillybeth-logo.png`],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Lillybeth®',
  url: siteUrl,
  logo: `${siteUrl}/lillybeth-logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    contactType: 'customer service',
  },
  sameAs: [siteConfig.social.facebook, siteConfig.social.instagram].filter(Boolean),
};

const lodgingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Lillybeth® Guesthouses',
  url: `${siteUrl}/frontend`,
  image: `${siteUrl}/lillybeth-logo.png`,
  telephone: siteConfig.contact.phone,
  email: siteConfig.contact.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: siteConfig.address.city,
    postalCode: siteConfig.address.postalCode,
    addressCountry: 'HU',
  },
};

export default function FrontendHomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={lodgingJsonLd} />
      <HeroSlider />
      <SearchSection />
      <BuildingsSection />
      <AboutSection />
      <GallerySection />
      <ReviewsSection />
      <MapSection />
    </>
  );
}
