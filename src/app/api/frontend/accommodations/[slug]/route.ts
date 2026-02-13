import { NextRequest, NextResponse } from 'next/server';
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

// Helper to get name string from building name field
function getNameString(name: unknown): string {
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const nameObj = name as Record<string, string>;
    return nameObj['en'] || nameObj['hu'] || Object.values(nameObj)[0] || '';
  }
  return '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const includeRelations = {
      images: {
        orderBy: { order: 'asc' as const },
      },
      amenityCategories: {
        include: {
          amenities: {
            orderBy: { order: 'asc' as const },
          },
        },
        orderBy: { order: 'asc' as const },
      },
      houseRules: {
        orderBy: { order: 'asc' as const },
      },
      roomTypes: {
        include: {
          images: {
            orderBy: { order: 'asc' as const },
          },
          amenityCategories: {
            include: {
              amenities: {
                orderBy: { order: 'asc' as const },
              },
            },
            orderBy: { order: 'asc' as const },
          },
          dateRangePrices: {
            orderBy: { startDate: 'asc' as const },
          },
        },
      },
    };

    // Try to find by stored slug or id first
    let accommodation = await prisma.building.findFirst({
      where: {
        OR: [
          { slug: slug },
          { id: slug },
        ],
      },
      include: includeRelations,
    });

    // If not found, try matching by generated slug from name
    if (!accommodation) {
      const allBuildings = await prisma.building.findMany({
        include: includeRelations,
      });

      accommodation = allBuildings.find((b) => {
        const nameStr = getNameString(b.name);
        const generatedSlug = generateSlug(nameStr);
        return generatedSlug === slug;
      }) || null;
    }

    if (!accommodation) {
      return NextResponse.json(
        { error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    // Calculate minimum price for each room type (use weekdayPrice as base)
    const roomTypesWithMinPrice = accommodation.roomTypes.map((roomType) => {
      const prices = roomType.dateRangePrices.map((p) => Math.min(Number(p.weekdayPrice), Number(p.weekendPrice)));
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;

      return {
        ...roomType,
        minPrice,
      };
    });

    // Get the name as string for slug generation
    const nameStr = getNameString(accommodation.name);

    // Return formatted response
    return NextResponse.json({
      id: accommodation.id,
      name: accommodation.name,
      slug: accommodation.slug || generateSlug(nameStr),
      description: accommodation.description,
      address: accommodation.address,
      latitude: accommodation.latitude,
      longitude: accommodation.longitude,
      cancellationPolicy: accommodation.cancellationPolicy,
      paymentMethods: accommodation.paymentMethods,
      depositInfo: accommodation.depositInfo,
      images: accommodation.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.filename || null,
      })),
      amenityCategories: accommodation.amenityCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        amenities: cat.amenities.map((a) => ({
          id: a.id,
          name: a.name,
          icon: null,
        })),
      })),
      houseRules: accommodation.houseRules.map((rule) => ({
        id: rule.id,
        rule: rule.value, // Use 'value' field as the rule text
      })),
      roomTypes: roomTypesWithMinPrice.map((rt) => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
        capacity: rt.capacity,
        minPrice: rt.minPrice,
        images: rt.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.filename || null,
        })),
        amenityCategories: rt.amenityCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          amenities: cat.amenities.map((a) => ({
            id: a.id,
            name: a.name,
            icon: null,
          })),
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accommodation' },
      { status: 500 }
    );
  }
}
