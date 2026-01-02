import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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

    // Validate date range
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      if (endDate < startDate) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}

    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.weekdayPrice !== undefined) updateData.weekdayPrice = parseFloat(data.weekdayPrice)
    if (data.weekendPrice !== undefined) updateData.weekendPrice = parseFloat(data.weekendPrice)
    if (data.minNights !== undefined) updateData.minNights = parseInt(data.minNights)

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
