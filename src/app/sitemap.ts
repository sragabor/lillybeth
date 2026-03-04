import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteConfig } from '@/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl;
  const now = new Date();

  const accommodations = await prisma.building.findMany({
    select: { slug: true, updatedAt: true },
    where: { slug: { not: null } },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/frontend`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/frontend/accommodation`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/frontend/szallas`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/frontend/unterkunft`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/frontend/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const accommodationPages: MetadataRoute.Sitemap = accommodations.flatMap((acc) => [
    { url: `${base}/frontend/accommodation/${acc.slug}`, lastModified: acc.updatedAt, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/frontend/szallas/${acc.slug}`, lastModified: acc.updatedAt, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/frontend/unterkunft/${acc.slug}`, lastModified: acc.updatedAt, changeFrequency: 'weekly', priority: 0.8 },
  ]);

  return [...staticPages, ...accommodationPages];
}
