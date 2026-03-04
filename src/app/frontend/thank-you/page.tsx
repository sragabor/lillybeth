import { Metadata } from 'next';
import { Suspense } from 'react';
import { ThankYouPage } from '@/components/frontend/pages/ThankYouPage';
import { siteConfig } from '@/config';

const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  title: 'Thank You | Lillybeth®',
  description: 'Your booking request has been received. Thank you for choosing Lillybeth® Guesthouses.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${siteUrl}/frontend/thank-you`,
  },
};

function ThankYouPageLoading() {
  return (
    <div className="min-h-screen bg-stone-50 pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
    </div>
  );
}

export default function ThankYouPageRoute() {
  return (
    <Suspense fallback={<ThankYouPageLoading />}>
      <ThankYouPage />
    </Suspense>
  );
}
