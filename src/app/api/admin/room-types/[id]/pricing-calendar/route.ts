import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface DayPricing {
  date: string
  price: number | null
  minNights: number | null
  isInactive: boolean
  source: 'override' | 'range' | 'none'
  isWeekend: boolean
  specialDay: string | null
}

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

// GET computed pricing for a month
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: roomTypeId } = await params
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  try {
    // Get the first and last day of the month
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    // Fetch date range prices that overlap with this month
    const dateRangePrices = await prisma.dateRangePrice.findMany({
      where: {
        roomTypeId,
        OR: [
          {
            startDate: { lte: lastDay },
            endDate: { gte: firstDay },
          },
        ],
      },
      orderBy: { startDate: 'asc' },
    })

    // Fetch calendar overrides for this month
    const calendarOverrides = await prisma.calendarOverride.findMany({
      where: {
        roomTypeId,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    })

    // Create a map of overrides by date
    const overrideMap = new Map<string, typeof calendarOverrides[0]>()
    for (const override of calendarOverrides) {
      const dateKey = override.date.toISOString().split('T')[0]
      overrideMap.set(dateKey, override)
    }

    // Fetch special days for this month (with date range support)
    const specialDaysList = await prisma.specialDay.findMany({
      where: {
        AND: [
          { startDate: { lte: lastDay } },
          { endDate: { gte: firstDay } },
        ],
      },
    })

    // Create a map of special days by date (expand ranges)
    const specialDaysMap = new Map<string, string>()
    for (const specialDay of specialDaysList) {
      const rangeStart = specialDay.startDate > firstDay ? specialDay.startDate : firstDay
      const rangeEnd = specialDay.endDate < lastDay ? specialDay.endDate : lastDay
      const dates = getDatesInRange(rangeStart, rangeEnd)
      for (const dateStr of dates) {
        specialDaysMap.set(dateStr, specialDay.name)
      }
    }

    // Generate pricing for each day of the month
    const days: DayPricing[] = []
    const currentDate = new Date(firstDay)

    while (currentDate <= lastDay) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday and Saturday

      let price: number | null = null
      let minNights: number | null = null
      let isInactive = false
      let source: 'override' | 'range' | 'none' = 'none'

      // Check for override first
      const override = overrideMap.get(dateKey)
      if (override) {
        if (override.isInactive) {
          isInactive = true
          source = 'override'
        } else {
          // Check if override has price
          if (override.price !== null) {
            price = override.price
            source = 'override'
          }
          // Check if override has minNights
          if (override.minNights !== null) {
            minNights = override.minNights
          }
        }
      }

      // If no override price, check date ranges
      if (price === null && !isInactive) {
        for (const range of dateRangePrices) {
          const rangeStart = new Date(range.startDate)
          const rangeEnd = new Date(range.endDate)

          if (currentDate >= rangeStart && currentDate <= rangeEnd) {
            price = isWeekend ? range.weekendPrice : range.weekdayPrice
            if (minNights === null) {
              minNights = range.minNights
            }
            source = 'range'
            break
          }
        }
      }

      days.push({
        date: dateKey,
        price,
        minNights,
        isInactive,
        source,
        isWeekend,
        specialDay: specialDaysMap.get(dateKey) || null,
      })

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({
      year,
      month,
      roomTypeId,
      days,
      dateRangePrices,
      calendarOverrides,
    })
  } catch (error) {
    console.error('Error fetching pricing calendar:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing calendar' }, { status: 500 })
  }
}
