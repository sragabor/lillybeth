import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// PUT update special day
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

    const specialDay = await prisma.specialDay.update({
      where: { id },
      data: {
        name: data.name,
        startDate,
        endDate,
      },
    })

    return NextResponse.json({ specialDay })
  } catch (error) {
    console.error('Error updating special day:', error)
    return NextResponse.json({ error: 'Failed to update special day' }, { status: 500 })
  }
}

// DELETE special day
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
    await prisma.specialDay.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting special day:', error)
    return NextResponse.json({ error: 'Failed to delete special day' }, { status: 500 })
  }
}
