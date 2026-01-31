import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PaymentMethod, PaymentStatus, PaymentCurrency } from '@/generated/prisma'

// Helper function to calculate payment status based on payments vs total amount
function calculatePaymentStatus(totalPaid: number, totalAmount: number | null): PaymentStatus {
  if (totalAmount === null || totalAmount <= 0) {
    return totalPaid > 0 ? 'FULLY_PAID' : 'PENDING'
  }

  if (totalPaid <= 0) {
    return 'PENDING'
  }

  if (totalPaid >= totalAmount) {
    return 'FULLY_PAID'
  }

  return 'PARTIALLY_PAID'
}

// GET all payments for a booking
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
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        totalAmount: true,
        hasCustomHufPrice: true,
        customHufPrice: true,
        paymentStatus: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Calculate totals by currency
    const paidEur = booking.payments
      .filter((p) => p.currency === 'EUR')
      .reduce((sum, p) => sum + p.amount, 0)
    const paidHuf = booking.payments
      .filter((p) => p.currency === 'HUF')
      .reduce((sum, p) => sum + p.amount, 0)

    // Legacy totalPaid for backwards compatibility (EUR only)
    const totalPaid = paidEur

    // Calculate remaining based on EUR price
    const remaining = (booking.totalAmount || 0) - paidEur

    return NextResponse.json({
      payments: booking.payments,
      summary: {
        totalAmount: booking.totalAmount,
        hasCustomHufPrice: booking.hasCustomHufPrice,
        customHufPrice: booking.customHufPrice,
        totalPaid,
        paidEur,
        paidHuf,
        remaining: remaining > 0 ? remaining : 0,
        paymentStatus: booking.paymentStatus,
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST create a new payment
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
    const data = await request.json()

    // Parse and validate amount
    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Validate payment method
    if (!data.method || !['CASH', 'TRANSFER', 'CREDIT_CARD'].includes(data.method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Validate currency (default to EUR if not provided)
    const currency = data.currency || 'EUR'
    if (!['EUR', 'HUF'].includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    // Validate date
    if (!data.date || typeof data.date !== 'string') {
      return NextResponse.json({ error: 'Payment date is required' }, { status: 400 })
    }

    // Parse date at noon UTC to avoid timezone issues with @db.Date
    const paymentDate = new Date(data.date + 'T12:00:00Z')
    if (isNaN(paymentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid payment date format' }, { status: 400 })
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency as PaymentCurrency,
        method: data.method as PaymentMethod,
        date: paymentDate,
        note: data.note || null,
        bookingId: id,
      },
    })

    // Calculate new total paid and update payment status
    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount
    const newPaymentStatus = calculatePaymentStatus(totalPaid, booking.totalAmount)

    // Update booking payment status if changed
    if (newPaymentStatus !== booking.paymentStatus) {
      await prisma.booking.update({
        where: { id },
        data: { paymentStatus: newPaymentStatus },
      })
    }

    return NextResponse.json({
      payment,
      paymentStatus: newPaymentStatus,
      totalPaid,
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    // Return more specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookingId } = await params

  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Verify payment belongs to this booking
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: { payments: true },
        },
      },
    })

    if (!payment || payment.bookingId !== bookingId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Delete the payment
    await prisma.payment.delete({ where: { id: paymentId } })

    // Recalculate total paid (excluding deleted payment)
    const totalPaid = payment.booking.payments
      .filter((p) => p.id !== paymentId)
      .reduce((sum, p) => sum + p.amount, 0)

    const newPaymentStatus = calculatePaymentStatus(totalPaid, payment.booking.totalAmount)

    // Update booking payment status if changed
    if (newPaymentStatus !== payment.booking.paymentStatus) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: newPaymentStatus },
      })
    }

    return NextResponse.json({
      success: true,
      paymentStatus: newPaymentStatus,
      totalPaid,
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
