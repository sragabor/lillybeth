import { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingPage } from '@/components/frontend/pages/BookingPage';
import { siteConfig } from '@/config';
import { seoConfig } from '@/config/seo';

const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  title: seoConfig.booking.en.title,
  description: seoConfig.booking.en.description,
  keywords: seoConfig.booking.en.keywords,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteUrl}/frontend/booking`,
  },
  openGraph: {
    title: seoConfig.booking.en.title,
    description: seoConfig.booking.en.description,
    url: `${siteUrl}/frontend/booking`,
    type: 'website',
    images: [{ url: `${siteUrl}/lillybeth-logo.png`, width: 400, height: 400 }],
  },
  twitter: {
    card: 'summary',
    title: seoConfig.booking.en.title,
    description: seoConfig.booking.en.description,
    images: [`${siteUrl}/lillybeth-logo.png`],
  },
};

function BookingPageLoading() {
  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 bg-stone-200 rounded w-64 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="h-6 bg-stone-200 rounded w-48 mb-6 animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="h-6 bg-stone-200 rounded w-40 mb-6 animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-px bg-stone-200 my-6" />
              <div className="h-12 bg-stone-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPageRoute() {
  return (
    <Suspense fallback={<BookingPageLoading />}>
      <BookingPage />
    </Suspense>
  );
}
