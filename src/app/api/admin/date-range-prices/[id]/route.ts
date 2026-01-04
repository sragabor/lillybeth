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

// GET single date range price
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
    const dateRangePrice = await prisma.dateRangePrice.findUnique({
      where: { id },
      include: {
        roomType: { select: { id: true, name: true } },
      },
    })

    if (!dateRangePrice) {
      return NextResponse.json({ error: 'Date range price not found' }, { status: 404 })
    }

    return NextResponse.json({ dateRangePrice })
  } catch (error) {
    console.error('Error fetching date range price:', error)
    return NextResponse.json({ error: 'Failed to fetch date range price' }, { status: 500 })
  }
}

// PUT update date range price
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

    // Get the existing record to get the roomTypeId and current dates
    const existing = await prisma.dateRangePrice.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Date range price not found' }, { status: 404 })
    }

    // Determine final dates (use new values if provided, otherwise use existing)
    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate

    // Validate date range
    if (endDate < startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Check for overlapping date ranges (excluding the current record)
    const { hasOverlap, overlappingRange } = await checkOverlap(
      existing.roomTypeId,
      startDate,
      endDate,
      id
    )

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

    const updateData: Record<string, unknown> = {}

    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.weekdayPrice !== undefined) updateData.weekdayPrice = parseFloat(data.weekdayPrice)
    if (data.weekendPrice !== undefined) updateData.weekendPrice = parseFloat(data.weekendPrice)
    if (data.minNights !== undefined) updateData.minNights = parseInt(data.minNights)
    if (data.isInactive !== undefined) updateData.isInactive = data.isInactive === true

    const dateRangePrice = await prisma.dateRangePrice.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ dateRangePrice })
  } catch (error) {
    console.error('Error updating date range price:', error)
    return NextResponse.json({ error: 'Failed to update date range price' }, { status: 500 })
  }
}

// DELETE date range price
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
    await prisma.dateRangePrice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting date range price:', error)
    return NextResponse.json({ error: 'Failed to delete date range price' }, { status: 500 })
  }
}
