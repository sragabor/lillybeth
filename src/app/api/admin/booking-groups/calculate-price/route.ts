import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface RoomPriceRequest {
  roomId: string
  guestCount: number
}

interface NightlyBreakdown {
  date: string
  dayOfWeek: string
  price: number
  isWeekend: boolean
  source: 'dateRange' | 'override' | 'none'
}

interface AdditionalPrice {
  id: string
  title: string
  priceEur: number
  quantity: number
  total: number
  mandatory: boolean
  perNight: boolean
  perGuest: boolean
}

interface RoomPriceBreakdown {
  roomId: string
  roomName: string
  buildingName: string
  roomTypeName: string
  nights: number
  nightlyBreakdown: NightlyBreakdown[]
  accommodationTotal: number
  mandatoryPrices: AdditionalPrice[]
  mandatoryTotal: number
  roomTotal: number
}

// POST calculate price for a group of rooms
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { checkIn, checkOut, rooms } = data as {
      checkIn: string
      checkOut: string
      rooms: RoomPriceRequest[]
    }

    if (!checkIn || !checkOut || !rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const roomBreakdowns: RoomPriceBreakdown[] = []
    let groupTotal = 0
    let groupMandatoryTotal = 0

    for (const roomReq of rooms) {
      // Fetch room with pricing info
      const room = await prisma.room.findUnique({
        where: { id: roomReq.roomId },
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
        return NextResponse.json({ error: `Room ${roomReq.roomId} not found` }, { status: 404 })
      }

      // Calculate nightly prices
      const nightlyBreakdown: NightlyBreakdown[] = []
      let accommodationTotal = 0
      const current = new Date(checkInDate)

      while (current < checkOutDate) {
        const dateStr = current.toISOString().split('T')[0]
        const dayOfWeek = current.getDay()
        // Weekend = Friday (5) or Saturday (6) nights
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
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

      // Calculate mandatory additional prices
      const mandatoryPrices: AdditionalPrice[] = []
      let mandatoryTotal = 0

      // Collect all mandatory prices from building and room type
      const allPrices = [
        ...room.roomType.building.additionalPrices.map((p) => ({ ...p, origin: 'building' as const })),
        ...room.roomType.additionalPrices.map((p) => ({ ...p, origin: 'roomType' as const })),
      ]

      for (const price of allPrices) {
        if (!price.mandatory) continue

        // Get title as string
        const title = typeof price.title === 'object' && price.title !== null
          ? (price.title as Record<string, string>).en || (price.title as Record<string, string>).hu || ''
          : String(price.title)

        // Calculate quantity based on perNight and perGuest flags
        let quantity = 1
        if (price.perNight) quantity *= nights
        if (price.perGuest) quantity *= roomReq.guestCount

        const total = price.priceEur * quantity

        mandatoryPrices.push({
          id: price.id,
          title,
          priceEur: price.priceEur,
          quantity,
          total,
          mandatory: true,
          perNight: price.perNight,
          perGuest: price.perGuest,
        })

        mandatoryTotal += total
      }

      const roomTotal = accommodationTotal + mandatoryTotal

      // Get room type name as string
      const roomTypeName = typeof room.roomType.name === 'object' && room.roomType.name !== null
        ? (room.roomType.name as Record<string, string>).en || (room.roomType.name as Record<string, string>).hu || ''
        : String(room.roomType.name)

      roomBreakdowns.push({
        roomId: room.id,
        roomName: room.name,
        buildingName: room.roomType.building.name,
        roomTypeName,
        nights,
        nightlyBreakdown,
        accommodationTotal,
        mandatoryPrices,
        mandatoryTotal,
        roomTotal,
      })

      groupTotal += roomTotal
      groupMandatoryTotal += mandatoryTotal
    }

    return NextResponse.json({
      nights,
      rooms: roomBreakdowns,
      groupAccommodationTotal: roomBreakdowns.reduce((sum, r) => sum + r.accommodationTotal, 0),
      groupMandatoryTotal,
      groupTotal,
    })
  } catch (error) {
    console.error('Error calculating group price:', error)
    return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 })
  }
}
