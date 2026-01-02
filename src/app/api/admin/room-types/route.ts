import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST create new room type
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.buildingId) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 })
    }

    const roomType = await prisma.roomType.create({
      data: {
        buildingId: data.buildingId,
        name: data.name,
        capacity: parseInt(data.capacity) || 2,
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
