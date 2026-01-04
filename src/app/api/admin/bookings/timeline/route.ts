import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Helper to generate all dates in a range
function getDatesInRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

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

    // Get all room IDs and room type IDs
    const roomIds: string[] = []
    const roomTypeIds: string[] = []
    const roomToRoomType: Record<string, string> = {}

    buildings.forEach((building) => {
      building.roomTypes.forEach((roomType) => {
        roomTypeIds.push(roomType.id)
        roomType.rooms.forEach((room) => {
          roomIds.push(room.id)
          roomToRoomType[room.id] = roomType.id
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

    // Enhancement data: Fetch inactive days (fail-safe - should not break core data)
    let inactiveDaysByRoomType: Record<string, string[]> = {}

    try {
      // Fetch inactive date ranges for room types
      const inactiveDateRanges = await prisma.dateRangePrice.findMany({
        where: {
          roomTypeId: { in: roomTypeIds },
          isInactive: true,
          startDate: { lte: end },
          endDate: { gte: start },
        },
        select: {
          roomTypeId: true,
          startDate: true,
          endDate: true,
        },
      })

      // Fetch inactive calendar overrides for room types
      const inactiveOverrides = await prisma.calendarOverride.findMany({
        where: {
          roomTypeId: { in: roomTypeIds },
          isInactive: true,
          date: { gte: start, lte: end },
        },
        select: {
          roomTypeId: true,
          date: true,
        },
      })

      // Build inactive days map: roomTypeId -> Set of inactive date strings
      // Add inactive date ranges
      inactiveDateRanges.forEach((range) => {
        if (!inactiveDaysByRoomType[range.roomTypeId]) {
          inactiveDaysByRoomType[range.roomTypeId] = []
        }
        const rangeStart = range.startDate > start ? range.startDate : start
        const rangeEnd = range.endDate < end ? range.endDate : end
        const dates = getDatesInRange(rangeStart, rangeEnd)
        inactiveDaysByRoomType[range.roomTypeId].push(...dates)
      })

      // Add inactive calendar overrides
      inactiveOverrides.forEach((override) => {
        if (!inactiveDaysByRoomType[override.roomTypeId]) {
          inactiveDaysByRoomType[override.roomTypeId] = []
        }
        inactiveDaysByRoomType[override.roomTypeId].push(
          override.date.toISOString().split('T')[0]
        )
      })

      // Deduplicate inactive days
      Object.keys(inactiveDaysByRoomType).forEach((roomTypeId) => {
        inactiveDaysByRoomType[roomTypeId] = [...new Set(inactiveDaysByRoomType[roomTypeId])]
      })
    } catch (inactiveError) {
      // Log but don't fail - inactive days are enhancement data, not critical
      console.error('Error fetching inactive days (non-critical):', inactiveError)
      inactiveDaysByRoomType = {}
    }

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
      roomToRoomType,
      inactiveDaysByRoomType,
      dateRange: { start: startDate, end: endDate },
    })
  } catch (error) {
    console.error('Error fetching timeline data:', error)
    return NextResponse.json({ error: 'Failed to fetch timeline data' }, { status: 500 })
  }
}
