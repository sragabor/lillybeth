import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { LocalizedText } from '@/lib/i18n'
import { Prisma } from '@/generated/prisma'

// GET all room types (grouped by building)
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const roomTypes = await prisma.roomType.findMany({
      include: {
        building: { select: { id: true, name: true } },
        rooms: { select: { id: true, name: true, isActive: true } },
      },
      orderBy: [
        { building: { name: 'asc' } },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({ roomTypes })
  } catch (error) {
    console.error('Error fetching room types:', error)
    return NextResponse.json({ error: 'Failed to fetch room types' }, { status: 500 })
  }
}

// POST create new room type
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json() as {
      buildingId: string
      name: LocalizedText
      capacity: number | string
    }

    if (!data.buildingId) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 })
    }

    const roomType = await prisma.roomType.create({
      data: {
        buildingId: data.buildingId,
        name: data.name as Prisma.InputJsonValue,
        capacity: parseInt(String(data.capacity)) || 2,
      },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        rooms: true,
      },
    })

    return NextResponse.json({ roomType }, { status: 201 })
  } catch (error) {
    console.error('Error creating room type:', error)
    return NextResponse.json({ error: 'Failed to create room type' }, { status: 500 })
  }
}
