import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET bookings list with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  // Tab filter (all, upcoming, past)
  const tab = searchParams.get('tab') || 'all'

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'checkIn'
  const sortOrder = searchParams.get('sortOrder') || 'asc'

  // Filters
  const buildingId = searchParams.get('buildingId')
  const roomTypeId = searchParams.get('roomTypeId')
  const roomId = searchParams.get('roomId')
  const source = searchParams.get('source')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const guestName = searchParams.get('guestName')

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // Tab-based date filtering
    if (tab === 'upcoming') {
      where.checkIn = { gte: today }
      where.status = { not: 'CANCELLED' }
    } else if (tab === 'past') {
      where.checkOut = { lt: today }
    }
    // 'all' tab shows everything

    // Room filter (direct)
    if (roomId) {
      where.roomId = roomId
    }

    // Room Type filter (via room relation)
    if (roomTypeId && !roomId) {
      where.room = {
        roomTypeId: roomTypeId,
      }
    }

    // Building filter (via room -> roomType relation)
    if (buildingId && !roomTypeId && !roomId) {
      where.room = {
        roomType: {
          buildingId: buildingId,
        },
      }
    }

    // Source filter
    if (source) {
      where.source = source
    }

    // Guest name search (case-insensitive)
    if (guestName) {
      where.guestName = {
        contains: guestName,
        mode: 'insensitive',
      }
    }

    // Date range filter (overlapping bookings)
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      where.AND = [
        { checkIn: { lte: end } },
        { checkOut: { gte: start } },
      ]
    } else if (startDate) {
      where.checkIn = { ...where.checkIn, gte: new Date(startDate) }
    } else if (endDate) {
      where.checkOut = { ...where.checkOut, lte: new Date(endDate) }
    }

    // Build orderBy clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = {}

    // Default sorting based on tab
    if (!searchParams.get('sortBy')) {
      if (tab === 'past') {
        orderBy = { checkIn: 'desc' }
      } else {
        orderBy = { checkIn: 'asc' }
      }
    } else {
      // Map sortBy to actual field
      const sortFieldMap: Record<string, string> = {
        guestName: 'guestName',
        checkIn: 'checkIn',
        guestCount: 'guestCount',
        totalAmount: 'totalAmount',
        createdAt: 'createdAt',
      }

      const field = sortFieldMap[sortBy] || 'checkIn'
      orderBy = { [field]: sortOrder }
    }

    // Count total for pagination
    const total = await prisma.booking.count({ where })

    // Fetch bookings with relations
    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    })

    // Calculate number of nights for each booking
    const bookingsWithNights = bookings.map((booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...booking,
        nights,
      }
    })

    // Pagination info
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      bookings: bookingsWithNights,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching bookings list:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
