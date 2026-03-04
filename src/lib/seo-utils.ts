import { prisma } from '@/lib/prisma';

export async function getAccommodationForSeo(slug: string) {
  return prisma.building.findFirst({
    where: { slug },
    select: {
      name: true,
      description: true,
      slug: true,
      address: true,
      latitude: true,
      longitude: true,
      images: {
        take: 1,
        orderBy: { order: 'asc' },
        select: { url: true },
      },
    },
  });
}

export function getLocalizedText(field: unknown, lang: string): string {
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field !== null) {
    const obj = field as Record<string, string>;
    return obj[lang] || obj['en'] || '';
  }
  return '';
}
