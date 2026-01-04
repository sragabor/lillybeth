import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// POST duplicate room type (without images)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const original = await prisma.roomType.findUnique({
      where: { id },
      include: {
        amenityCategories: {
          include: { amenities: true },
        },
        additionalPrices: true,
        rooms: true,
      },
    })

    if (!original) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    // Create duplicate (without images as per spec)
    const duplicate = await prisma.roomType.create({
      data: {
        buildingId: original.buildingId,
        name: `${original.name} (Copy)`,
        capacity: original.capacity,
        // Duplicate amenity categories
        amenityCategories: {
          create: original.amenityCategories.map((cat, i) => ({
            name: cat.name as Prisma.InputJsonValue,
            order: i,
            amenities: {
              create: cat.amenities.map((amenity, j) => ({
                name: amenity.name as Prisma.InputJsonValue,
                order: j,
              })),
            },
          })),
        },
        // Duplicate additional prices
        additionalPrices: {
          create: original.additionalPrices.map((price, i) => ({
            title: price.title as Prisma.InputJsonValue,
            priceEur: price.priceEur,
            mandatory: price.mandatory,
            perNight: price.perNight,
            order: i,
          })),
        },
        // Duplicate rooms
        rooms: {
          create: original.rooms.map((room) => ({
            name: `${room.name} (Copy)`,
            isActive: room.isActive,
          })),
        },
      },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        rooms: true,
      },
    })

    return NextResponse.json({ roomType: duplicate }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating room type:', error)
    return NextResponse.json({ error: 'Failed to duplicate room type' }, { status: 500 })
  }
}
