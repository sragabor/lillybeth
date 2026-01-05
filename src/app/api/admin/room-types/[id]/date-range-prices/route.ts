import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Helper function to check for date range overlaps
async function checkOverlap(
  roomTypeId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string
): Promise<{ hasOverlap: boolean; overlappingRange?: { startDate: Date; endDate: Date } }> {
  // Find any existing date ranges that overlap with the new range
  // Two ranges overlap if: startA <= endB AND endA >= startB
  const overlappingRanges = await prisma.dateRangePrice.findMany({
    where: {
      roomTypeId,
      id: excludeId ? { not: excludeId } : undefined,
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    },
    orderBy: { startDate: 'asc' },
    take: 1,
  })

  if (overlappingRanges.length > 0) {
    return {
      hasOverlap: true,
      overlappingRange: {
        startDate: overlappingRanges[0].startDate,
        endDate: overlappingRanges[0].endDate,
      },
    }
  }

  return { hasOverlap: false }
}

// Format date for error message
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// GET all date range prices for a room type
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
    const dateRangePrices = await prisma.dateRangePrice.findMany({
      where: { roomTypeId: id },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ dateRangePrices })
  } catch (error) {
    console.error('Error fetching date range prices:', error)
    return NextResponse.json({ error: 'Failed to fetch date range prices' }, { status: 500 })
  }
}

// POST create a new date range price
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: roomTypeId } = await params

  try {
    const data = await request.json()

    // Validate required fields (prices not required if marking as inactive)
    const isInactive = data.isInactive === true
    if (!data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    // Validate prices if not inactive - check for empty strings, null, undefined, and NaN
    if (!isInactive) {
      const weekdayPrice = data.weekdayPrice === '' || data.weekdayPrice === null || data.weekdayPrice === undefined
        ? NaN : parseFloat(data.weekdayPrice)
      const weekendPrice = data.weekendPrice === '' || data.weekendPrice === null || data.weekendPrice === undefined
        ? NaN : parseFloat(data.weekendPrice)

      if (isNaN(weekdayPrice) || isNaN(weekendPrice)) {
        return NextResponse.json({ error: 'Weekday price and weekend price are required' }, { status: 400 })
      }
    }

    // Ensure end date is after start date
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (endDate < startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Check for overlapping date ranges
    const { hasOverlap, overlappingRange } = await checkOverlap(roomTypeId, startDate, endDate)

    if (hasOverlap && overlappingRange) {
      return NextResponse.json({
        error: 'Date range overlap',
        message: `This date range overlaps with an existing range (${formatDate(overlappingRange.startDate)} - ${formatDate(overlappingRange.endDate)}). Please adjust your dates.`,
        overlappingRange: {
          startDate: formatDate(overlappingRange.startDate),
          endDate: formatDate(overlappingRange.endDate),
        },
      }, { status: 409 })
    }

    // Parse values safely
    const weekdayPrice = isInactive ? 0 : parseFloat(data.weekdayPrice)
    const weekendPrice = isInactive ? 0 : parseFloat(data.weekendPrice)
    const minNights = parseInt(data.minNights) || 1

    const dateRangePrice = await prisma.dateRangePrice.create({
      data: {
        roomTypeId,
        startDate,
        endDate,
        weekdayPrice,
        weekendPrice,
        minNights,
        isInactive,
      },
    })

    return NextResponse.json({ dateRangePrice }, { status: 201 })
  } catch (error) {
    console.error('Error creating date range price:', error)
    // Return more specific error message if available
    const message = error instanceof Error ? error.message : 'Failed to create date range price'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
