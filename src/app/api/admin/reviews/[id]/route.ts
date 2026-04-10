import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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

    if (!data.name || !data.text || !data.country || !data.language) {
      return NextResponse.json({ error: 'Name, text, country and language are required' }, { status: 400 })
    }

    const rating = Math.min(10, Math.max(1, Number(data.rating) || 5))

    // Replace building associations
    await prisma.reviewBuilding.deleteMany({ where: { reviewId: id } })

    const review = await prisma.review.update({
      where: { id },
      data: {
        name: data.name,
        title: data.title || null,
        text: data.text,
        country: data.country,
        language: data.language,
        rating,
        buildings: {
          create: (data.buildingIds ?? []).map((buildingId: string) => ({ buildingId })),
        },
      },
      include: {
        buildings: {
          include: {
            building: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

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
    await prisma.review.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
