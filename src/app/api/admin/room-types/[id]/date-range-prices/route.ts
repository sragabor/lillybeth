import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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

    // Validate required fields
    if (!data.startDate || !data.endDate || data.weekdayPrice === undefined || data.weekendPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure end date is after start date
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate < startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const dateRangePrice = await prisma.dateRangePrice.create({
      data: {
        roomTypeId,
        startDate,
        endDate,
        weekdayPrice: parseFloat(data.weekdayPrice),
        weekendPrice: parseFloat(data.weekendPrice),
        minNights: parseInt(data.minNights) || 1,
      },
    })

    return NextResponse.json({ dateRangePrice }, { status: 201 })
  } catch (error) {
    console.error('Error creating date range price:', error)
    return NextResponse.json({ error: 'Failed to create date range price' }, { status: 500 })
  }
}
