import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET all special days
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filterStart = searchParams.get('startDate')
  const filterEnd = searchParams.get('endDate')

  try {
    const where: Record<string, unknown> = {}

    // Date range filter - find special days that overlap with the requested range
    if (filterStart && filterEnd) {
      where.AND = [
        { startDate: { lte: new Date(filterEnd) } },
        { endDate: { gte: new Date(filterStart) } },
      ]
    }

    const specialDays = await prisma.specialDay.findMany({
      where,
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ specialDays })
  } catch (error) {
    console.error('Error fetching special days:', error)
    return NextResponse.json({ error: 'Failed to fetch special days' }, { status: 500 })
  }
}

// POST create new special day
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.name || !data.startDate) {
      return NextResponse.json({ error: 'Name and start date are required' }, { status: 400 })
    }

    // If endDate is not provided, use startDate (single day)
    const startDate = new Date(data.startDate + 'T12:00:00Z')
    const endDate = data.endDate ? new Date(data.endDate + 'T12:00:00Z') : startDate

    // Validate that endDate is not before startDate
    if (endDate < startDate) {
      return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 })
    }

    const specialDay = await prisma.specialDay.create({
      data: {
        name: data.name,
        startDate,
        endDate,
      },
    })

    return NextResponse.json({ specialDay }, { status: 201 })
  } catch (error) {
    console.error('Error creating special day:', error)
    return NextResponse.json({ error: 'Failed to create special day' }, { status: 500 })
  }
}
