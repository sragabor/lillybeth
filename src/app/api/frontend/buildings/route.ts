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

/**
 * Public API endpoint for fetching buildings (no authentication required)
 * Returns only public-facing data for the frontend
 */
export async function GET() {
  try {
    const buildings = await prisma.building.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        latitude: true,
        longitude: true,
        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format the response - generate slug from name if not set
    const formattedBuildings = buildings.map((building) => {
      // Get the name as string (it might be stored as JSON with language keys)
      let nameStr = '';
      if (typeof building.name === 'string') {
        nameStr = building.name;
      } else if (typeof building.name === 'object' && building.name !== null) {
        const nameObj = building.name as Record<string, string>;
        nameStr = nameObj['en'] || nameObj['hu'] || Object.values(nameObj)[0] || '';
      }

      return {
        id: building.id,
        name: building.name,
        slug: building.slug || generateSlug(nameStr),
        description: building.description,
        address: building.address,
        latitude: building.latitude,
        longitude: building.longitude,
        images: building.images,
      };
    });

    return NextResponse.json(formattedBuildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}
