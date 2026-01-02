import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET single room type with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        building: { select: { id: true, name: true } },
        images: { orderBy: { order: 'asc' } },
        amenityCategories: {
          orderBy: { order: 'asc' },
          include: {
            amenities: { orderBy: { order: 'asc' } },
          },
        },
        additionalPrices: { orderBy: { order: 'asc' } },
        rooms: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    return NextResponse.json({ roomType })
  } catch (error) {
    console.error('Error fetching room type:', error)
    return NextResponse.json({ error: 'Failed to fetch room type' }, { status: 500 })
  }
}

// PUT update room type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        name: data.name,
        capacity: parseInt(data.capacity) || 2,
      },
    })

    return NextResponse.json({ roomType })
  } catch (error) {
    console.error('Error updating room type:', error)
    return NextResponse.json({ error: 'Failed to update room type' }, { status: 500 })
  }
}

// DELETE room type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check for children
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: { rooms: true },
    })

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    const { confirm } = await request.json().catch(() => ({ confirm: false }))

    if (roomType.rooms.length > 0 && !confirm) {
      return NextResponse.json({
        requiresConfirmation: true,
        roomsCount: roomType.rooms.length,
      })
    }

    await prisma.roomType.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room type:', error)
    return NextResponse.json({ error: 'Failed to delete room type' }, { status: 500 })
  }
}
