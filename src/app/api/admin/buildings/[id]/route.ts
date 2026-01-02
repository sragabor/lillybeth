import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET single building with all relations
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
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        houseRules: { orderBy: { order: 'asc' } },
        amenityCategories: {
          orderBy: { order: 'asc' },
          include: {
            amenities: { orderBy: { order: 'asc' } },
          },
        },
        additionalPrices: { orderBy: { order: 'asc' } },
        roomTypes: {
          orderBy: { createdAt: 'asc' },
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
            rooms: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    return NextResponse.json({ building })
  } catch (error) {
    console.error('Error fetching building:', error)
    return NextResponse.json({ error: 'Failed to fetch building' }, { status: 500 })
  }
}

// PUT update building
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

    const building = await prisma.building.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        description: data.description,
        cancellationPolicy: data.cancellationPolicy,
        paymentMethods: data.paymentMethods,
        depositInfo: data.depositInfo,
      },
    })

    return NextResponse.json({ building })
  } catch (error) {
    console.error('Error updating building:', error)
    return NextResponse.json({ error: 'Failed to update building' }, { status: 500 })
  }
}

// DELETE building
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
    // Check for children
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        roomTypes: {
          include: { rooms: true },
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    const hasChildren = building.roomTypes.length > 0
    const hasGrandchildren = building.roomTypes.some((rt) => rt.rooms.length > 0)

    // Return info about children for confirmation
    const { confirm } = await request.json().catch(() => ({ confirm: false }))

    if (hasChildren && !confirm) {
      return NextResponse.json({
        requiresConfirmation: true,
        hasChildren,
        hasGrandchildren,
        roomTypesCount: building.roomTypes.length,
        roomsCount: building.roomTypes.reduce((acc, rt) => acc + rt.rooms.length, 0),
      })
    }

    await prisma.building.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting building:', error)
    return NextResponse.json({ error: 'Failed to delete building' }, { status: 500 })
  }
}
