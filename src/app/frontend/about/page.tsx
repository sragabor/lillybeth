import { Metadata } from 'next';
import { AboutPage } from '@/components/frontend/pages/AboutPage';
import { JsonLd } from '@/components/frontend/seo/JsonLd';
import { siteConfig } from '@/config';
import { seoConfig } from '@/config/seo';

const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  title: seoConfig.about.en.title,
  description: seoConfig.about.en.description,
  keywords: seoConfig.about.en.keywords,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteUrl}/frontend/about`,
    languages: {
      en: `${siteUrl}/frontend/about`,
      hu: `${siteUrl}/frontend/about`,
      de: `${siteUrl}/frontend/about`,
      'x-default': `${siteUrl}/frontend/about`,
    },
  },
  openGraph: {
    title: seoConfig.about.en.title,
    description: seoConfig.about.en.description,
    url: `${siteUrl}/frontend/about`,
    type: 'website',
    images: [{ url: `${siteUrl}/lillybeth-logo.png`, width: 400, height: 400 }],
  },
  twitter: {
    card: 'summary',
    title: seoConfig.about.en.title,
    description: seoConfig.about.en.description,
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

export default function AboutPageRoute() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <AboutPage />
    </>
  );
}
