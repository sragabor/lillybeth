import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET all bookings (with optional date range filter for timeline)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const buildingId = searchParams.get('buildingId')
  const roomId = searchParams.get('roomId')

  try {
    const where: Record<string, unknown> = {}

    // Date range filter (for timeline view)
    if (startDate && endDate) {
      where.OR = [
        {
          checkIn: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          checkOut: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { checkIn: { lte: new Date(startDate) } },
            { checkOut: { gte: new Date(endDate) } },
          ],
        },
      ]
    }

    // Room filter
    if (roomId) {
      where.roomId = roomId
    }

    // Building filter (through room -> roomType -> building)
    if (buildingId) {
      where.room = {
        roomType: {
          buildingId,
        },
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          include: {
            roomType: {
              include: {
                building: { select: { id: true, name: true } },
              },
            },
          },
        },
        additionalPrices: true,
      },
      orderBy: { checkIn: 'asc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// Helper function to check minimum nights requirement
async function checkMinimumNights(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ valid: boolean; required?: number; actual?: number }> {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  // Check calendar overrides for each night of the stay
  const calendarOverrides = await prisma.calendarOverride.findMany({
    where: {
      roomTypeId,
      date: {
        gte: checkIn,
        lt: checkOut,
      },
      minNights: { not: null },
    },
  })

  // Get the maximum minNights requirement from overrides
  let maxMinNights = 1
  for (const override of calendarOverrides) {
    if (override.minNights !== null && override.minNights > maxMinNights) {
      maxMinNights = override.minNights
    }
  }

  // Also check date range prices
  const dateRangePrices = await prisma.dateRangePrice.findMany({
    where: {
      roomTypeId,
      startDate: { lte: checkOut },
      endDate: { gte: checkIn },
    },
  })

  for (const range of dateRangePrices) {
    if (range.minNights > maxMinNights) {
      maxMinNights = range.minNights
    }
  }

  if (nights < maxMinNights) {
    return { valid: false, required: maxMinNights, actual: nights }
  }

  return { valid: true }
}

// Helper function to check for inactive days
async function checkInactiveDays(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ valid: boolean; inactiveDates?: string[] }> {
  const inactiveOverrides = await prisma.calendarOverride.findMany({
    where: {
      roomTypeId,
      date: {
        gte: checkIn,
        lt: checkOut,
      },
      isInactive: true,
    },
  })

  if (inactiveOverrides.length > 0) {
    return {
      valid: false,
      inactiveDates: inactiveOverrides.map((o) => o.date.toISOString().split('T')[0]),
    }
  }

  return { valid: true }
}

// POST create new booking
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Validate required fields
    if (!data.roomId || !data.checkIn || !data.checkOut || !data.guestName || !data.source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checkIn = new Date(data.checkIn)
    const checkOut = new Date(data.checkOut)

    // Validate dates
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Get room with room type info
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { roomType: true },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if room is active (skip for admin - they can book inactive rooms but with warning)
    // Note: For website bookings, this would be enforced. For admin, we allow it but could add a warning.
    if (!room.isActive && data.source === 'WEBSITE') {
      return NextResponse.json({ error: 'This room is not available for online booking' }, { status: 400 })
    }

    // Check for inactive days in the booking range
    const inactiveDaysCheck = await checkInactiveDays(room.roomTypeId, checkIn, checkOut)
    if (!inactiveDaysCheck.valid) {
      return NextResponse.json({
        error: `Some dates are not available: ${inactiveDaysCheck.inactiveDates?.join(', ')}`,
      }, { status: 400 })
    }

    // Check minimum nights requirement
    const minNightsCheck = await checkMinimumNights(room.roomTypeId, checkIn, checkOut)
    if (!minNightsCheck.valid) {
      return NextResponse.json({
        error: `Minimum stay is ${minNightsCheck.required} nights (selected: ${minNightsCheck.actual})`,
      }, { status: 400 })
    }

    // Check for overlapping bookings (excluding cancelled)
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json({ error: 'Room is already booked for these dates' }, { status: 400 })
    }

    // Prepare additional prices data if provided
    const additionalPricesCreate = Array.isArray(data.additionalPrices)
      ? data.additionalPrices.map((price: { title: string; priceEur: number; quantity?: number }) => ({
          title: price.title,
          priceEur: price.priceEur,
          quantity: price.quantity || 1,
        }))
      : []

    const booking = await prisma.booking.create({
      data: {
        roomId: data.roomId,
        source: data.source,
        guestName: data.guestName,
        guestEmail: data.guestEmail || null,
        guestPhone: data.guestPhone || null,
        guestCount: parseInt(data.guestCount) || 1,
        checkIn,
        checkOut,
        status: data.status || 'INCOMING',
        paymentStatus: data.paymentStatus || 'PENDING',
        notes: data.notes || null,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : null,
        additionalPrices: {
          create: additionalPricesCreate,
        },
      },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                building: { select: { id: true, name: true } },
              },
            },
          },
        },
        additionalPrices: true,
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
