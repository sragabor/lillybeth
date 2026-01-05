import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET detailed booking info with price breakdown
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
    // Fetch booking with all relations
    const booking = await prisma.booking.findUnique({
      where: { id },
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
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Calculate nights
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    // Get room type for pricing info
    const room = await prisma.room.findUnique({
      where: { id: booking.roomId },
      include: {
        roomType: {
          include: {
            dateRangePrices: true,
            calendarOverrides: true,
            additionalPrices: true,
            building: {
              include: {
                additionalPrices: true,
              },
            },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Calculate nightly price breakdown
    const nightlyBreakdown: {
      date: string
      dayOfWeek: string
      price: number
      isWeekend: boolean
      source: 'dateRange' | 'override' | 'none'
    }[] = []

    let accommodationTotal = 0
    const current = new Date(checkIn)

    while (current < checkOut) {
      const dateStr = current.toISOString().split('T')[0]
      const dayOfWeek = current.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const dayName = current.toLocaleDateString('en-US', { weekday: 'short' })

      // Check for calendar override first
      const override = room.roomType.calendarOverrides.find(
        (o) => o.date.toISOString().split('T')[0] === dateStr && o.price !== null
      )

      let price = 0
      let source: 'dateRange' | 'override' | 'none' = 'none'

      if (override && override.price !== null) {
        price = override.price
        source = 'override'
      } else {
        // Find applicable date range
        const dateRange = room.roomType.dateRangePrices.find((dr) => {
          const start = new Date(dr.startDate)
          const end = new Date(dr.endDate)
          return current >= start && current <= end && !dr.isInactive
        })

        if (dateRange) {
          price = isWeekend ? dateRange.weekendPrice : dateRange.weekdayPrice
          source = 'dateRange'
        }
      }

      nightlyBreakdown.push({
        date: dateStr,
        dayOfWeek: dayName,
        price,
        isWeekend,
        source,
      })

      accommodationTotal += price
      current.setDate(current.getDate() + 1)
    }

    // Categorize additional prices
    const mandatoryPrices = booking.additionalPrices.filter((p) => {
      // Check if this was a mandatory price (we don't store this, so we infer from building/roomType)
      const buildingPrice = room.roomType.building.additionalPrices.find(
        (bp) => {
          const title = typeof bp.title === 'object' && bp.title !== null
            ? (bp.title as Record<string, string>).en || (bp.title as Record<string, string>).hu
            : String(bp.title)
          return title === p.title && bp.mandatory
        }
      )
      const roomTypePrice = room.roomType.additionalPrices.find(
        (rp) => {
          const title = typeof rp.title === 'object' && rp.title !== null
            ? (rp.title as Record<string, string>).en || (rp.title as Record<string, string>).hu
            : String(rp.title)
          return title === p.title && rp.mandatory
        }
      )
      return buildingPrice || roomTypePrice
    })

    const optionalPrices = booking.additionalPrices.filter(
      (p) => !mandatoryPrices.includes(p)
    )

    // Calculate totals
    const mandatoryTotal = mandatoryPrices.reduce(
      (sum, p) => sum + p.priceEur * p.quantity,
      0
    )
    const optionalTotal = optionalPrices.reduce(
      (sum, p) => sum + p.priceEur * p.quantity,
      0
    )
    const additionalTotal = mandatoryTotal + optionalTotal

    return NextResponse.json({
      booking: {
        ...booking,
        nights,
      },
      priceBreakdown: {
        nights,
        nightlyBreakdown,
        accommodationTotal,
        mandatoryPrices: mandatoryPrices.map((p) => ({
          ...p,
          total: p.priceEur * p.quantity,
        })),
        optionalPrices: optionalPrices.map((p) => ({
          ...p,
          total: p.priceEur * p.quantity,
        })),
        mandatoryTotal,
        optionalTotal,
        additionalTotal,
        grandTotal: booking.totalAmount || accommodationTotal + additionalTotal,
      },
    })
  } catch (error) {
    console.error('Error fetching booking details:', error)
    return NextResponse.json({ error: 'Failed to fetch booking details' }, { status: 500 })
  }
}
