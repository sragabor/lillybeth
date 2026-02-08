import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET available additional prices for a room type + building
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomTypeId = searchParams.get('roomTypeId')
  const buildingId = searchParams.get('buildingId')

  if (!roomTypeId || !buildingId) {
    return NextResponse.json({ error: 'roomTypeId and buildingId are required' }, { status: 400 })
  }

  try {
    // Fetch building additional prices
    const buildingPrices = await prisma.buildingAdditionalPrice.findMany({
      where: { buildingId },
      orderBy: { order: 'asc' },
    })

    // Fetch room type additional prices
    const roomTypePrices = await prisma.roomTypeAdditionalPrice.findMany({
      where: { roomTypeId },
      orderBy: { order: 'asc' },
    })

    // Combine and format prices
    interface PriceRecord {
      id: string
      title: unknown
      priceEur: number
      mandatory: boolean
      perNight: boolean
      perGuest: boolean
    }

    const prices = [
      ...buildingPrices.map((p: PriceRecord) => ({
        id: p.id,
        title: typeof p.title === 'object' && p.title !== null
          ? (p.title as Record<string, string>).en || (p.title as Record<string, string>).hu || ''
          : String(p.title),
        priceEur: p.priceEur,
        mandatory: p.mandatory,
        perNight: p.perNight,
        perGuest: p.perGuest,
        origin: 'building' as const,
      })),
      ...roomTypePrices.map((p: PriceRecord) => ({
        id: p.id,
        title: typeof p.title === 'object' && p.title !== null
          ? (p.title as Record<string, string>).en || (p.title as Record<string, string>).hu || ''
          : String(p.title),
        priceEur: p.priceEur,
        mandatory: p.mandatory,
        perNight: p.perNight,
        perGuest: p.perGuest,
        origin: 'roomType' as const,
      })),
    ]

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Error fetching additional prices:', error)
    return NextResponse.json({ error: 'Failed to fetch additional prices' }, { status: 500 })
  }
}
