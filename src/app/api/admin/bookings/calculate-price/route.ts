import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface AdditionalPriceOption {
  id: string
  title: string
  priceEur: number
  mandatory: boolean
  perNight: boolean
  origin: 'building' | 'roomType'
}

interface SelectedAdditionalPrice {
  id: string
  title: string
  priceEur: number
  quantity: number
  total: number
  origin: 'building' | 'roomType'
}

interface PriceBreakdown {
  nights: number
  nightlyPrices: { date: string; price: number; source: string }[]
  accommodationTotal: number
  availableAdditionalPrices: AdditionalPriceOption[]
  additionalPrices: SelectedAdditionalPrice[]
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

    // Selected optional price IDs from the request
    const selectedPriceIds: string[] = data.selectedPriceIds || []
    // Selected optional price titles (for matching by title, used in drag & drop)
    const selectedPriceTitles: string[] = data.selectedPriceTitles || []

    // Get room with room type and building
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        roomType: {
          include: {
            additionalPrices: { orderBy: { order: 'asc' } },
            building: {
              include: {
                additionalPrices: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const roomTypeId = room.roomTypeId
    const building = room.roomType.building

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

    // Build list of all available additional prices
    const availableAdditionalPrices: AdditionalPriceOption[] = []

    // Add building-level additional prices
    for (const price of building.additionalPrices) {
      const titleObj = price.title as Record<string, string>
      const title = titleObj?.en || titleObj?.hu || 'Additional fee'
      availableAdditionalPrices.push({
        id: price.id,
        title,
        priceEur: price.priceEur,
        mandatory: price.mandatory,
        perNight: price.perNight,
        origin: 'building',
      })
    }

    // Add room type-level additional prices
    for (const price of room.roomType.additionalPrices) {
      const titleObj = price.title as Record<string, string>
      const title = titleObj?.en || titleObj?.hu || 'Additional fee'
      availableAdditionalPrices.push({
        id: price.id,
        title,
        priceEur: price.priceEur,
        mandatory: price.mandatory,
        perNight: price.perNight,
        origin: 'roomType',
      })
    }

    // Calculate selected additional prices (mandatory + selected optional)
    const additionalPrices: SelectedAdditionalPrice[] = []
    let additionalTotal = 0

    for (const priceOption of availableAdditionalPrices) {
      // Include if mandatory OR if selected by ID OR if selected by title match
      const isSelectedById = selectedPriceIds.includes(priceOption.id)
      const isSelectedByTitle = selectedPriceTitles.includes(priceOption.title)
      if (priceOption.mandatory || isSelectedById || isSelectedByTitle) {
        const quantity = priceOption.perNight ? nights : 1
        const total = priceOption.priceEur * quantity

        additionalPrices.push({
          id: priceOption.id,
          title: priceOption.title,
          priceEur: priceOption.priceEur,
          quantity,
          total,
          origin: priceOption.origin,
        })
        additionalTotal += total
      }
    }

    const breakdown: PriceBreakdown = {
      nights,
      nightlyPrices,
      accommodationTotal,
      availableAdditionalPrices,
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
