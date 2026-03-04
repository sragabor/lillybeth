import { Metadata } from 'next';
import { AccommodationListPage } from '@/components/frontend/pages/AccommodationListPage';
import { siteConfig } from '@/config';
import { seoConfig } from '@/config/seo';

const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  title: seoConfig.accommodationList.en.title,
  description: seoConfig.accommodationList.en.description,
  keywords: seoConfig.accommodationList.en.keywords,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteUrl}/frontend/accommodation`,
    languages: {
      en: `${siteUrl}/frontend/accommodation`,
      hu: `${siteUrl}/frontend/szallas`,
      de: `${siteUrl}/frontend/unterkunft`,
      'x-default': `${siteUrl}/frontend/accommodation`,
    },
  },
  openGraph: {
    title: seoConfig.accommodationList.en.title,
    description: seoConfig.accommodationList.en.description,
    url: `${siteUrl}/frontend/accommodation`,
    type: 'website',
    images: [{ url: `${siteUrl}/lillybeth-logo.png`, width: 400, height: 400 }],
  },
  twitter: {
    card: 'summary',
    title: seoConfig.accommodationList.en.title,
    description: seoConfig.accommodationList.en.description,
    images: [`${siteUrl}/lillybeth-logo.png`],
  },
};

export default function AccommodationListPageEN() {
  return <AccommodationListPage routeLanguage="en" />;
}
