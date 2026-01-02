import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET timeline data: rooms grouped by building and bookings for date range
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const buildingId = searchParams.get('buildingId')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start and end date are required' }, { status: 400 })
  }

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Fetch buildings with room types and rooms
    const buildingWhere = buildingId ? { id: buildingId } : {}

    const buildings = await prisma.building.findMany({
      where: buildingWhere,
      include: {
        roomTypes: {
          orderBy: { name: 'asc' },
          include: {
            rooms: {
              orderBy: { name: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get all room IDs
    const roomIds: string[] = []
    buildings.forEach((building) => {
      building.roomTypes.forEach((roomType) => {
        roomType.rooms.forEach((room) => {
          roomIds.push(room.id)
        })
      })
    })

    // Fetch bookings that overlap with the date range
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: { in: roomIds },
        status: { not: 'CANCELLED' },
        OR: [
          {
            checkIn: { lte: end },
            checkOut: { gte: start },
          },
        ],
      },
      include: {
        additionalPrices: true,
        room: {
          select: {
            id: true,
            name: true,
            roomType: {
              select: {
                id: true,
                name: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { checkIn: 'asc' },
    })

    // Group bookings by room ID for easy lookup
    const bookingsByRoom: Record<string, typeof bookings> = {}
    bookings.forEach((booking) => {
      if (!bookingsByRoom[booking.roomId]) {
        bookingsByRoom[booking.roomId] = []
      }
      bookingsByRoom[booking.roomId].push(booking)
    })

    return NextResponse.json({
      buildings,
      bookings,
      bookingsByRoom,
      dateRange: { start: startDate, end: endDate },
    })
  } catch (error) {
    console.error('Error fetching timeline data:', error)
    return NextResponse.json({ error: 'Failed to fetch timeline data' }, { status: 500 })
  }
}
