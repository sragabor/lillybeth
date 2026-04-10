import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const language = (searchParams.get('language') ?? 'EN').toUpperCase()
  const buildingId = searchParams.get('buildingId')

  try {
    const reviews = await prisma.review.findMany({
      where: {
        language: language as 'EN' | 'HU' | 'DE',
        ...(buildingId
          ? { buildings: { some: { buildingId } } }
          : {}),
      },
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
    console.error('Error fetching frontend reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
