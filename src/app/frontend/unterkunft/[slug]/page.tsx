import { Metadata } from 'next';
import { AccommodationDetailPage } from '@/components/frontend/pages/AccommodationDetailPage';
import { JsonLd } from '@/components/frontend/seo/JsonLd';
import { siteConfig } from '@/config';
import { seoConfig } from '@/config/seo';
import { getAccommodationForSeo, getLocalizedText } from '@/lib/seo-utils';

const { siteUrl } = siteConfig;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const accommodation = await getAccommodationForSeo(slug);
  const name = accommodation ? accommodation.name : slug;
  const desc = accommodation ? getLocalizedText(accommodation.description, 'de') : '';
  const image = accommodation?.images[0]?.url ?? `${siteUrl}/lillybeth-logo.png`;

  return {
    title: `${name} | Lillybeth®`,
    description: desc.slice(0, 160) || seoConfig.accommodationDetail.de.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${siteUrl}/frontend/unterkunft/${slug}`,
      languages: {
        en: `${siteUrl}/frontend/accommodation/${slug}`,
        hu: `${siteUrl}/frontend/szallas/${slug}`,
        de: `${siteUrl}/frontend/unterkunft/${slug}`,
        'x-default': `${siteUrl}/frontend/accommodation/${slug}`,
      },
    },
    openGraph: {
      title: `${name} | Lillybeth®`,
      description: desc.slice(0, 160) || seoConfig.accommodationDetail.de.description,
      url: `${siteUrl}/frontend/unterkunft/${slug}`,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Lillybeth®`,
      images: [image],
    },
  };
}

function buildLodgingJsonLd(accommodation: {
  name: string;
  description: unknown;
  slug: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: { url: string }[];
}) {
  const desc = getLocalizedText(accommodation.description, 'de');
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: accommodation.name,
    description: desc || undefined,
    url: `${siteUrl}/frontend/unterkunft/${accommodation.slug}`,
    image: accommodation.images.map((img) => img.url),
    address: {
      '@type': 'PostalAddress',
      streetAddress: accommodation.address || undefined,
      addressLocality: siteConfig.address.city,
      postalCode: siteConfig.address.postalCode,
      addressCountry: 'HU',
    },
    ...(accommodation.latitude && accommodation.longitude
      ? { geo: { '@type': 'GeoCoordinates', latitude: accommodation.latitude, longitude: accommodation.longitude } }
      : {}),
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const accommodation = await getAccommodationForSeo(slug);
  const jsonLd = accommodation ? buildLodgingJsonLd(accommodation) : null;

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <AccommodationDetailPage slug={slug} routeLanguage="de" />
    </>
  );
}
