import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to generate slug from building name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const accommodations = await prisma.building.findMany({
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 10, // Get up to 10 images for listing slider
        },
        roomTypes: {
          include: {
            dateRangePrices: true,
          },
        },
      },
    });

    // Calculate minimum price for each accommodation
    const accommodationsWithMinPrice = accommodations.map((accommodation) => {
      const allPrices = accommodation.roomTypes.flatMap((rt) =>
        rt.dateRangePrices.map((p) => Math.min(Number(p.weekdayPrice), Number(p.weekendPrice)))
      );
      const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

      // Get the name as string for slug generation
      let nameStr = '';
      if (typeof accommodation.name === 'string') {
        nameStr = accommodation.name;
      } else if (typeof accommodation.name === 'object' && accommodation.name !== null) {
        const nameObj = accommodation.name as Record<string, string>;
        nameStr = nameObj['en'] || nameObj['hu'] || Object.values(nameObj)[0] || '';
      }

      // Calculate total capacity from room types
      const totalCapacity = accommodation.roomTypes.reduce((sum, rt) => sum + (rt.capacity || 0), 0);

      return {
        id: accommodation.id,
        name: accommodation.name,
        slug: accommodation.slug || generateSlug(nameStr),
        description: accommodation.description,
        address: accommodation.address,
        images: accommodation.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.filename || null,
        })),
        minPrice,
        roomCount: accommodation.roomTypes.length,
        totalCapacity,
      };
    });

    return NextResponse.json(accommodationsWithMinPrice);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accommodations' },
      { status: 500 }
    );
  }
}
