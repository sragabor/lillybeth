import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET all buildings
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const buildings = await prisma.building.findMany({
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ buildings })
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 })
  }
}

// POST create new building
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const building = await prisma.building.create({
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

    return NextResponse.json({ building }, { status: 201 })
  } catch (error) {
    console.error('Error creating building:', error)
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
