import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET single room
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
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: {
          include: {
            building: { select: { id: true, name: true } },
          },
        },
        bookings: {
          orderBy: { checkIn: 'desc' },
          take: 5,
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 })
  }
}

// PUT update room
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

    const room = await prisma.room.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

// DELETE room
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
    // Check for bookings
    const room = await prisma.room.findUnique({
      where: { id },
      include: { bookings: true },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const { confirm } = await request.json().catch(() => ({ confirm: false }))

    if (room.bookings.length > 0 && !confirm) {
      return NextResponse.json({
        requiresConfirmation: true,
        bookingsCount: room.bookings.length,
      })
    }

    await prisma.room.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
