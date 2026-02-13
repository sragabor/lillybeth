'use client';

import { useParams } from 'next/navigation';
import { AccommodationDetailPage } from '@/components/frontend/pages/AccommodationDetailPage';

export default function AccommodationDetailPageHU() {
  const params = useParams();
  const slug = params.slug as string;

  return <AccommodationDetailPage slug={slug} routeLanguage="hu" />;
}
