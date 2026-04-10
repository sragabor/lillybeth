import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const reviews = await prisma.review.findMany({
      include: {
        buildings: {
          include: {
            building: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.name || !data.text || !data.country || !data.language) {
      return NextResponse.json({ error: 'Name, text, country and language are required' }, { status: 400 })
    }

    const rating = Math.min(10, Math.max(1, Number(data.rating) || 5))

    const review = await prisma.review.create({
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

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
