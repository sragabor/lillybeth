import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET single booking
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
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                building: true,
              },
            },
          },
        },
        additionalPrices: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}

// Helper function to check minimum nights requirement
async function checkMinimumNights(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ valid: boolean; required?: number; actual?: number }> {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  // Check calendar overrides for minNights
  const calendarOverrides = await prisma.calendarOverride.findMany({
    where: {
      roomTypeId,
      date: { gte: checkIn, lt: checkOut },
      minNights: { not: null },
    },
  })

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
      date: { gte: checkIn, lt: checkOut },
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

// PUT update booking
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

    // Get current booking to determine what's changing
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { roomType: true } } },
    })

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (data.guestName !== undefined) updateData.guestName = data.guestName
    if (data.guestEmail !== undefined) updateData.guestEmail = data.guestEmail || null
    if (data.guestPhone !== undefined) updateData.guestPhone = data.guestPhone || null
    if (data.guestCount !== undefined) updateData.guestCount = parseInt(data.guestCount)
    if (data.source !== undefined) updateData.source = data.source
    if (data.status !== undefined) updateData.status = data.status
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount ? parseFloat(data.totalAmount) : null

    // Handle date changes
    if (data.checkIn !== undefined) updateData.checkIn = new Date(data.checkIn)
    if (data.checkOut !== undefined) updateData.checkOut = new Date(data.checkOut)

    // Determine effective dates and room for validation
    const effectiveCheckIn = data.checkIn ? new Date(data.checkIn) : currentBooking.checkIn
    const effectiveCheckOut = data.checkOut ? new Date(data.checkOut) : currentBooking.checkOut
    const effectiveRoomId = data.roomId || currentBooking.roomId

    // Get room info for the effective room
    const effectiveRoom = data.roomId
      ? await prisma.room.findUnique({ where: { id: data.roomId }, include: { roomType: true } })
      : currentBooking.room

    if (!effectiveRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Validate date order
    if (effectiveCheckOut <= effectiveCheckIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Check for inactive days (if dates or room changed)
    if (data.checkIn !== undefined || data.checkOut !== undefined || data.roomId !== undefined) {
      const inactiveDaysCheck = await checkInactiveDays(effectiveRoom.roomTypeId, effectiveCheckIn, effectiveCheckOut)
      if (!inactiveDaysCheck.valid) {
        return NextResponse.json({
          error: `Some dates are not available: ${inactiveDaysCheck.inactiveDates?.join(', ')}`,
        }, { status: 400 })
      }

      // Check minimum nights requirement
      const minNightsCheck = await checkMinimumNights(effectiveRoom.roomTypeId, effectiveCheckIn, effectiveCheckOut)
      if (!minNightsCheck.valid) {
        return NextResponse.json({
          error: `Minimum stay is ${minNightsCheck.required} nights (selected: ${minNightsCheck.actual})`,
        }, { status: 400 })
      }
    }

    // Check for overlapping bookings (if dates or room changed)
    if (data.checkIn !== undefined || data.checkOut !== undefined || data.roomId !== undefined) {
      const overlapping = await prisma.booking.findFirst({
        where: {
          roomId: effectiveRoomId,
          id: { not: id },
          status: { not: 'CANCELLED' },
          OR: [
            {
              checkIn: { lt: effectiveCheckOut },
              checkOut: { gt: effectiveCheckIn },
            },
          ],
        },
      })

      if (overlapping) {
        return NextResponse.json({ error: 'Room is already booked for these dates' }, { status: 400 })
      }
    }

    if (data.roomId !== undefined) {
      updateData.roomId = data.roomId
    }

    // Handle additional prices update if provided
    if (Array.isArray(data.additionalPrices)) {
      // Delete existing additional prices
      await prisma.bookingAdditionalPrice.deleteMany({
        where: { bookingId: id },
      })

      // Create new additional prices
      if (data.additionalPrices.length > 0) {
        await prisma.bookingAdditionalPrice.createMany({
          data: data.additionalPrices.map((price: { title: string; priceEur: number; quantity?: number }) => ({
            bookingId: id,
            title: price.title,
            priceEur: price.priceEur,
            quantity: price.quantity || 1,
          })),
        })
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

// DELETE booking
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
    await prisma.booking.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
