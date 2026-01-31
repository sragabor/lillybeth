import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { LocalizedText } from '@/lib/i18n'
import { Prisma } from '@/generated/prisma'

interface PriceInput {
  title: LocalizedText
  priceEur: number
  mandatory: boolean
  perNight: boolean
  perGuest: boolean
}

// POST create/update additional prices (batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: roomTypeId } = await params

  try {
    const { prices } = await request.json() as { prices: PriceInput[] }

    await prisma.roomTypeAdditionalPrice.deleteMany({ where: { roomTypeId } })

    if (prices && prices.length > 0) {
      await prisma.roomTypeAdditionalPrice.createMany({
        data: prices.map((price, index) => ({
          roomTypeId,
          title: price.title as Prisma.InputJsonValue,
          priceEur: price.priceEur,
          mandatory: price.mandatory,
          perNight: price.perNight,
          perGuest: price.perGuest || false,
          order: index,
        })),
      })
    }

    const updatedPrices = await prisma.roomTypeAdditionalPrice.findMany({
      where: { roomTypeId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ prices: updatedPrices })
  } catch (error) {
    console.error('Error updating additional prices:', error)
    return NextResponse.json({ error: 'Failed to update additional prices' }, { status: 500 })
  }
}
