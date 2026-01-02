import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST duplicate room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const original = await prisma.room.findUnique({
      where: { id },
    })

    if (!original) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const duplicate = await prisma.room.create({
      data: {
        roomTypeId: original.roomTypeId,
        name: `${original.name} (Copy)`,
        isActive: original.isActive,
      },
    })

    return NextResponse.json({ room: duplicate }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating room:', error)
    return NextResponse.json({ error: 'Failed to duplicate room' }, { status: 500 })
  }
}
