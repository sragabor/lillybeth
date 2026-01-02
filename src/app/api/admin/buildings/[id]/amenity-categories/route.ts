import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface AmenityInput {
  name: string
}

interface CategoryInput {
  id?: string
  name: string
  amenities: AmenityInput[]
}

// POST create/update amenity categories (batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: buildingId } = await params

  try {
    const { categories } = await request.json() as { categories: CategoryInput[] }

    // Delete existing categories (cascades to amenities)
    await prisma.buildingAmenityCategory.deleteMany({ where: { buildingId } })

    // Create new categories with amenities
    if (categories && categories.length > 0) {
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i]
        await prisma.buildingAmenityCategory.create({
          data: {
            buildingId,
            name: cat.name,
            order: i,
            amenities: {
              create: cat.amenities.map((amenity, j) => ({
                name: amenity.name,
                order: j,
              })),
            },
          },
        })
      }
    }

    const updatedCategories = await prisma.buildingAmenityCategory.findMany({
      where: { buildingId },
      orderBy: { order: 'asc' },
      include: {
        amenities: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json({ categories: updatedCategories })
  } catch (error) {
    console.error('Error updating amenity categories:', error)
    return NextResponse.json({ error: 'Failed to update amenity categories' }, { status: 500 })
  }
}
