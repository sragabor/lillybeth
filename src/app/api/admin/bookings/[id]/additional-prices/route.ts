import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST batch update additional prices for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookingId } = await params

  try {
    const { prices } = await request.json()

    if (!Array.isArray(prices)) {
      return NextResponse.json({ error: 'Prices must be an array' }, { status: 400 })
    }

    // Delete existing additional prices
    await prisma.bookingAdditionalPrice.deleteMany({
      where: { bookingId },
    })

    // Create new additional prices
    if (prices.length > 0) {
      await prisma.bookingAdditionalPrice.createMany({
        data: prices.map((price: { title: string; priceEur: number; quantity?: number }) => ({
          bookingId,
          title: price.title,
          priceEur: parseFloat(price.priceEur.toString()),
          quantity: parseInt(price.quantity?.toString() || '1'),
        })),
      })
    }

    // Fetch updated booking with additional prices
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        additionalPrices: true,
      },
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error updating booking additional prices:', error)
    return NextResponse.json({ error: 'Failed to update additional prices' }, { status: 500 })
  }
}
