import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET all calendar overrides for a room type (optionally filtered by date range)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  try {
    const where: Record<string, unknown> = { roomTypeId: id }

    // Optional date range filter
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const calendarOverrides = await prisma.calendarOverride.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ calendarOverrides })
  } catch (error) {
    console.error('Error fetching calendar overrides:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar overrides' }, { status: 500 })
  }
}

// POST create or update a single calendar override
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

    if (!data.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const date = new Date(data.date)

    // Upsert: create or update based on unique constraint
    const calendarOverride = await prisma.calendarOverride.upsert({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date,
        },
      },
      update: {
        price: data.price !== undefined ? parseFloat(data.price) : null,
        minNights: data.minNights !== undefined ? parseInt(data.minNights) : null,
        isInactive: data.isInactive ?? false,
      },
      create: {
        roomTypeId,
        date,
        price: data.price !== undefined ? parseFloat(data.price) : null,
        minNights: data.minNights !== undefined ? parseInt(data.minNights) : null,
        isInactive: data.isInactive ?? false,
      },
    })

    return NextResponse.json({ calendarOverride }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating calendar override:', error)
    return NextResponse.json({ error: 'Failed to create/update calendar override' }, { status: 500 })
  }
}

// PUT bulk update multiple calendar overrides
export async function PUT(
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

    if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
      return NextResponse.json({ error: 'Dates array is required' }, { status: 400 })
    }

    const results = []

    // Process each date
    for (const dateStr of data.dates) {
      const date = new Date(dateStr)

      const calendarOverride = await prisma.calendarOverride.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date,
          },
        },
        update: {
          price: data.price !== undefined ? parseFloat(data.price) : undefined,
          minNights: data.minNights !== undefined ? parseInt(data.minNights) : undefined,
          isInactive: data.isInactive !== undefined ? data.isInactive : undefined,
        },
        create: {
          roomTypeId,
          date,
          price: data.price !== undefined ? parseFloat(data.price) : null,
          minNights: data.minNights !== undefined ? parseInt(data.minNights) : null,
          isInactive: data.isInactive ?? false,
        },
      })

      results.push(calendarOverride)
    }

    return NextResponse.json({ calendarOverrides: results })
  } catch (error) {
    console.error('Error bulk updating calendar overrides:', error)
    return NextResponse.json({ error: 'Failed to bulk update calendar overrides' }, { status: 500 })
  }
}

// DELETE remove calendar overrides for specific dates
export async function DELETE(
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

    if (data.dates && Array.isArray(data.dates)) {
      // Delete specific dates
      await prisma.calendarOverride.deleteMany({
        where: {
          roomTypeId,
          date: {
            in: data.dates.map((d: string) => new Date(d)),
          },
        },
      })
    } else if (data.date) {
      // Delete single date
      await prisma.calendarOverride.delete({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date: new Date(data.date),
          },
        },
      })
    } else {
      return NextResponse.json({ error: 'Date(s) required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar override:', error)
    return NextResponse.json({ error: 'Failed to delete calendar override' }, { status: 500 })
  }
}
