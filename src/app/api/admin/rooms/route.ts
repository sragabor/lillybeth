import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST create new room
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.roomTypeId) {
      return NextResponse.json({ error: 'Room type ID is required' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        roomTypeId: data.roomTypeId,
        name: data.name,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
