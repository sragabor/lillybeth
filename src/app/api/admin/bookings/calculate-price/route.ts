import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface PriceBreakdown {
  nights: number
  nightlyPrices: { date: string; price: number; source: string }[]
  accommodationTotal: number
  additionalPrices: { title: string; priceEur: number; quantity: number; total: number }[]
  additionalTotal: number
  grandTotal: number
}

// Helper to check if a date is weekend (Friday or Saturday night)
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 5 || day === 6 // Friday = 5, Saturday = 6
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.roomId || !data.checkIn || !data.checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checkIn = new Date(data.checkIn)
    const checkOut = new Date(data.checkOut)

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Get room with room type
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        roomType: {
          include: {
            additionalPrices: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const roomTypeId = room.roomTypeId

    // Get date range prices for the period
    const dateRangePrices = await prisma.dateRangePrice.findMany({
      where: {
        roomTypeId,
        startDate: { lte: checkOut },
        endDate: { gte: checkIn },
      },
      orderBy: { startDate: 'asc' },
    })

    // Get calendar overrides for the period
    const calendarOverrides = await prisma.calendarOverride.findMany({
      where: {
        roomTypeId,
        date: {
          gte: checkIn,
          lt: checkOut,
        },
      },
    })

    // Create a map of overrides by date
    const overrideMap = new Map<string, { price: number | null; isInactive: boolean }>()
    for (const override of calendarOverrides) {
      const dateKey = override.date.toISOString().split('T')[0]
      overrideMap.set(dateKey, {
        price: override.price,
        isInactive: override.isInactive,
      })
    }

    // Calculate nightly prices
    const nightlyPrices: { date: string; price: number; source: string }[] = []
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn)
      currentDate.setDate(currentDate.getDate() + i)
      const dateKey = currentDate.toISOString().split('T')[0]

      // Check for override first
      const override = overrideMap.get(dateKey)
      if (override?.price !== null && override?.price !== undefined) {
        nightlyPrices.push({ date: dateKey, price: override.price, source: 'override' })
        continue
      }

      // Check date range prices
      let priceFound = false
      for (const range of dateRangePrices) {
        if (currentDate >= range.startDate && currentDate <= range.endDate) {
          const price = isWeekend(currentDate) ? range.weekendPrice : range.weekdayPrice
          nightlyPrices.push({ date: dateKey, price, source: 'range' })
          priceFound = true
          break
        }
      }

      if (!priceFound) {
        nightlyPrices.push({ date: dateKey, price: 0, source: 'none' })
      }
    }

    const accommodationTotal = nightlyPrices.reduce((sum, night) => sum + night.price, 0)

    // Calculate additional prices (mandatory ones by default)
    const additionalPrices: { title: string; priceEur: number; quantity: number; total: number }[] = []
    let additionalTotal = 0

    for (const price of room.roomType.additionalPrices) {
      if (price.mandatory) {
        const titleObj = price.title as Record<string, string>
        const title = titleObj?.en || titleObj?.hu || 'Additional fee'
        const quantity = price.perNight ? nights : 1
        const total = price.priceEur * quantity

        additionalPrices.push({
          title,
          priceEur: price.priceEur,
          quantity,
          total,
        })
        additionalTotal += total
      }
    }

    const breakdown: PriceBreakdown = {
      nights,
      nightlyPrices,
      accommodationTotal,
      additionalPrices,
      additionalTotal,
      grandTotal: accommodationTotal + additionalTotal,
    }

    return NextResponse.json({ breakdown })
  } catch (error) {
    console.error('Error calculating price:', error)
    return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 })
  }
}
