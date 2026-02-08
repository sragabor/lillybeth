import prisma from '@/lib/prisma'

/**
 * Unified Pricing Service
 *
 * All pricing calculations MUST go through this service to ensure consistency.
 * Never calculate totals manually in route handlers.
 */

export interface NightlyPrice {
  date: string
  price: number
  source: 'dateRange' | 'override' | 'none'
  isWeekend: boolean
}

export interface CalculatedAdditionalPrice {
  sourceId: string
  sourceType: 'building' | 'roomType'
  title: string
  unitPrice: number
  quantity: number
  total: number
  mandatory: boolean
  perNight: boolean
  perGuest: boolean
}

export interface RoomPricingResult {
  nights: number
  nightlyPrices: NightlyPrice[]
  accommodationTotal: number
  additionalPrices: CalculatedAdditionalPrice[]
  additionalPricesTotal: number
  grandTotal: number
}

export interface GroupPricingResult {
  nights: number
  rooms: {
    roomId: string
    roomName: string
    guestCount: number
    accommodationTotal: number
    additionalPricesTotal: number
    roomTotal: number
  }[]
  groupAccommodationTotal: number
  groupAdditionalPricesTotal: number
  groupGrandTotal: number
}

// Helper to check if a date is weekend (Friday or Saturday night)
function isWeekendNight(date: Date): boolean {
  const day = date.getDay()
  return day === 5 || day === 6 // Friday = 5, Saturday = 6
}

// Helper to get localized title from JSON field
function getLocalizedTitle(title: unknown): string {
  if (typeof title === 'object' && title !== null) {
    const titleObj = title as Record<string, string>
    return titleObj.en || titleObj.hu || ''
  }
  return String(title || '')
}

// Helper to calculate nights between dates
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate complete pricing for a single room booking
 *
 * @param roomId - The room ID
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param guestCount - Number of guests
 * @param selectedAdditionalPriceIds - Array of selected optional price source IDs
 * @returns Complete pricing breakdown including accommodation and additional prices
 */
export async function calculateRoomPricing(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  guestCount: number,
  selectedAdditionalPriceIds: { sourceId: string; sourceType: 'building' | 'roomType' }[] = []
): Promise<RoomPricingResult> {
  const nights = calculateNights(checkIn, checkOut)

  // Fetch room with all pricing data
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      roomType: {
        include: {
          dateRangePrices: true,
          calendarOverrides: true,
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
    throw new Error(`Room ${roomId} not found`)
  }

  // Calculate nightly accommodation prices
  const nightlyPrices: NightlyPrice[] = []
  let accommodationTotal = 0
  const current = new Date(checkIn)

  while (current < checkOut) {
    const dateStr = current.toISOString().split('T')[0]
    const isWeekend = isWeekendNight(current)

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

    nightlyPrices.push({
      date: dateStr,
      price,
      source,
      isWeekend,
    })

    accommodationTotal += price
    current.setDate(current.getDate() + 1)
  }

  // Calculate additional prices
  const additionalPrices: CalculatedAdditionalPrice[] = []
  let additionalPricesTotal = 0

  // Collect all available prices from building and room type
  const allAvailablePrices = [
    ...room.roomType.building.additionalPrices.map((p) => ({
      ...p,
      sourceType: 'building' as const,
    })),
    ...room.roomType.additionalPrices.map((p) => ({
      ...p,
      sourceType: 'roomType' as const,
    })),
  ]

  // Create a set of selected IDs for quick lookup
  const selectedIds = new Set(
    selectedAdditionalPriceIds.map((s) => `${s.sourceType}:${s.sourceId}`)
  )

  for (const price of allAvailablePrices) {
    const priceKey = `${price.sourceType}:${price.id}`
    const isSelected = selectedIds.has(priceKey)

    // Include if mandatory OR if explicitly selected
    if (price.mandatory || isSelected) {
      // Calculate quantity based on rules
      let quantity = 1
      if (price.perNight) {
        quantity = nights
      }
      if (price.perGuest) {
        quantity *= guestCount
      }

      const total = price.priceEur * quantity

      additionalPrices.push({
        sourceId: price.id,
        sourceType: price.sourceType,
        title: getLocalizedTitle(price.title),
        unitPrice: price.priceEur,
        quantity,
        total,
        mandatory: price.mandatory,
        perNight: price.perNight,
        perGuest: price.perGuest,
      })

      additionalPricesTotal += total
    }
  }

  return {
    nights,
    nightlyPrices,
    accommodationTotal,
    additionalPrices,
    additionalPricesTotal,
    grandTotal: accommodationTotal + additionalPricesTotal,
  }
}

/**
 * Calculate complete pricing for a group booking
 *
 * @param groupId - The booking group ID
 * @returns Complete pricing breakdown for all rooms in the group
 */
export async function calculateGroupPricing(groupId: string): Promise<GroupPricingResult> {
  const group = await prisma.bookingGroup.findUnique({
    where: { id: groupId },
    include: {
      bookings: {
        include: {
          additionalPrices: true,
          room: {
            include: {
              roomType: {
                include: {
                  dateRangePrices: true,
                  calendarOverrides: true,
                  additionalPrices: { orderBy: { order: 'asc' } },
                  building: {
                    include: {
                      additionalPrices: { orderBy: { order: 'asc' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!group) {
    throw new Error(`Booking group ${groupId} not found`)
  }

  const checkIn = new Date(group.checkIn)
  const checkOut = new Date(group.checkOut)
  const nights = calculateNights(checkIn, checkOut)

  const roomResults: GroupPricingResult['rooms'] = []
  let groupAccommodationTotal = 0
  let groupAdditionalPricesTotal = 0

  for (const booking of group.bookings) {
    // Calculate accommodation for this room
    let accommodationTotal = 0
    const current = new Date(checkIn)

    while (current < checkOut) {
      const dateStr = current.toISOString().split('T')[0]
      const isWeekend = isWeekendNight(current)

      // Check for calendar override first
      const override = booking.room.roomType.calendarOverrides.find(
        (o) => o.date.toISOString().split('T')[0] === dateStr && o.price !== null
      )

      let price = 0

      if (override && override.price !== null) {
        price = override.price
      } else {
        // Find applicable date range
        const dateRange = booking.room.roomType.dateRangePrices.find((dr) => {
          const start = new Date(dr.startDate)
          const end = new Date(dr.endDate)
          return current >= start && current <= end && !dr.isInactive
        })

        if (dateRange) {
          price = isWeekend ? dateRange.weekendPrice : dateRange.weekdayPrice
        }
      }

      accommodationTotal += price
      current.setDate(current.getDate() + 1)
    }

    // Calculate additional prices total from stored BookingAdditionalPrice records
    const additionalPricesTotal = booking.additionalPrices.reduce(
      (sum, p) => sum + p.priceEur * p.quantity,
      0
    )

    const roomTotal = accommodationTotal + additionalPricesTotal

    roomResults.push({
      roomId: booking.roomId,
      roomName: booking.room.name,
      guestCount: booking.guestCount,
      accommodationTotal,
      additionalPricesTotal,
      roomTotal,
    })

    groupAccommodationTotal += accommodationTotal
    groupAdditionalPricesTotal += additionalPricesTotal
  }

  return {
    nights,
    rooms: roomResults,
    groupAccommodationTotal,
    groupAdditionalPricesTotal,
    groupGrandTotal: groupAccommodationTotal + groupAdditionalPricesTotal,
  }
}

/**
 * Recalculate and persist totals for a room booking within a group
 * Call this after modifying additional prices
 */
export async function recalculateAndPersistRoomTotal(
  bookingId: string,
  groupId: string
): Promise<{ roomTotal: number; groupTotal: number }> {
  // Get the booking with its group
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      additionalPrices: true,
      room: {
        include: {
          roomType: {
            include: {
              dateRangePrices: true,
              calendarOverrides: true,
            },
          },
        },
      },
      group: true,
    },
  })

  if (!booking || !booking.group) {
    throw new Error('Booking or group not found')
  }

  const checkIn = new Date(booking.group.checkIn)
  const checkOut = new Date(booking.group.checkOut)

  // Calculate accommodation total
  let accommodationTotal = 0
  const current = new Date(checkIn)

  while (current < checkOut) {
    const dateStr = current.toISOString().split('T')[0]
    const isWeekend = isWeekendNight(current)

    const override = booking.room.roomType.calendarOverrides.find(
      (o) => o.date.toISOString().split('T')[0] === dateStr && o.price !== null
    )

    let price = 0

    if (override && override.price !== null) {
      price = override.price
    } else {
      const dateRange = booking.room.roomType.dateRangePrices.find((dr) => {
        const start = new Date(dr.startDate)
        const end = new Date(dr.endDate)
        return current >= start && current <= end && !dr.isInactive
      })

      if (dateRange) {
        price = isWeekend ? dateRange.weekendPrice : dateRange.weekdayPrice
      }
    }

    accommodationTotal += price
    current.setDate(current.getDate() + 1)
  }

  // Calculate additional prices total
  const additionalPricesTotal = booking.additionalPrices.reduce(
    (sum, p) => sum + p.priceEur * p.quantity,
    0
  )

  const roomTotal = accommodationTotal + additionalPricesTotal

  // Update booking's totalAmount
  await prisma.booking.update({
    where: { id: bookingId },
    data: { totalAmount: roomTotal > 0 ? roomTotal : null },
  })

  // Recalculate group total
  const groupPricing = await calculateGroupPricing(groupId)

  // Update group's totalAmount
  await prisma.bookingGroup.update({
    where: { id: groupId },
    data: { totalAmount: groupPricing.groupGrandTotal > 0 ? groupPricing.groupGrandTotal : null },
  })

  return {
    roomTotal,
    groupTotal: groupPricing.groupGrandTotal,
  }
}
