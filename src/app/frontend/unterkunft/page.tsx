import { Metadata } from 'next';
import { AccommodationListPage } from '@/components/frontend/pages/AccommodationListPage';
import { siteConfig } from '@/config';
import { seoConfig } from '@/config/seo';

const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  title: seoConfig.accommodationList.de.title,
  description: seoConfig.accommodationList.de.description,
  keywords: seoConfig.accommodationList.de.keywords,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteUrl}/frontend/unterkunft`,
    languages: {
      en: `${siteUrl}/frontend/accommodation`,
      hu: `${siteUrl}/frontend/szallas`,
      de: `${siteUrl}/frontend/unterkunft`,
      'x-default': `${siteUrl}/frontend/accommodation`,
    },
  },
  openGraph: {
    title: seoConfig.accommodationList.de.title,
    description: seoConfig.accommodationList.de.description,
    url: `${siteUrl}/frontend/unterkunft`,
    type: 'website',
    images: [{ url: `${siteUrl}/lillybeth-logo.png`, width: 400, height: 400 }],
  },
  twitter: {
    card: 'summary',
    title: seoConfig.accommodationList.de.title,
    description: seoConfig.accommodationList.de.description,
    images: [`${siteUrl}/lillybeth-logo.png`],
  },
};

export default function AccommodationListPageDE() {
  return <AccommodationListPage routeLanguage="de" />;
}
