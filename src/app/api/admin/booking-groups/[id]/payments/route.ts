import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PaymentMethod, PaymentStatus, PaymentCurrency } from '@/generated/prisma'

// Helper function to calculate payment status
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

// GET all payments for a booking group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: groupId } = await params

  try {
    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
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

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Calculate totals by currency
    const paidEur = group.payments
      .filter((p) => p.currency === 'EUR')
      .reduce((sum, p) => sum + p.amount, 0)
    const paidHuf = group.payments
      .filter((p) => p.currency === 'HUF')
      .reduce((sum, p) => sum + p.amount, 0)

    const remaining = (group.totalAmount || 0) - paidEur

    return NextResponse.json({
      payments: group.payments,
      summary: {
        totalAmount: group.totalAmount,
        hasCustomHufPrice: group.hasCustomHufPrice,
        customHufPrice: group.customHufPrice,
        totalPaid: paidEur,
        paidEur,
        paidHuf,
        remaining: remaining > 0 ? remaining : 0,
        paymentStatus: group.paymentStatus,
      },
    })
  } catch (error) {
    console.error('Error fetching group payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST create a new payment for a booking group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: groupId } = await params

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

    // Validate currency
    const currency = data.currency || 'EUR'
    if (!['EUR', 'HUF'].includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    // Validate date
    if (!data.date || typeof data.date !== 'string') {
      return NextResponse.json({ error: 'Payment date is required' }, { status: 400 })
    }

    const paymentDate = new Date(data.date + 'T12:00:00Z')
    if (isNaN(paymentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid payment date format' }, { status: 400 })
    }

    // Verify group exists
    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
      include: { payments: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency as PaymentCurrency,
        method: data.method as PaymentMethod,
        date: paymentDate,
        note: data.note || null,
        groupId,
      },
    })

    // Calculate new total paid (EUR only for status calculation)
    const totalPaidEur = group.payments
      .filter((p) => p.currency === 'EUR')
      .reduce((sum, p) => sum + p.amount, 0) + (currency === 'EUR' ? amount : 0)

    const newPaymentStatus = calculatePaymentStatus(totalPaidEur, group.totalAmount)

    // Update group payment status if changed
    if (newPaymentStatus !== group.paymentStatus) {
      await prisma.bookingGroup.update({
        where: { id: groupId },
        data: { paymentStatus: newPaymentStatus },
      })
    }

    return NextResponse.json({
      payment,
      paymentStatus: newPaymentStatus,
      totalPaid: totalPaidEur,
    })
  } catch (error) {
    console.error('Error creating group payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}

// DELETE a payment from a booking group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: groupId } = await params
  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('paymentId')

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
  }

  try {
    // Verify payment belongs to this group
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        group: {
          include: { payments: true },
        },
      },
    })

    if (!payment || payment.groupId !== groupId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Delete the payment
    await prisma.payment.delete({ where: { id: paymentId } })

    // Recalculate total paid (excluding deleted payment)
    const totalPaidEur = payment.group!.payments
      .filter((p) => p.id !== paymentId && p.currency === 'EUR')
      .reduce((sum, p) => sum + p.amount, 0)

    const newPaymentStatus = calculatePaymentStatus(totalPaidEur, payment.group!.totalAmount)

    // Update group payment status if changed
    if (newPaymentStatus !== payment.group!.paymentStatus) {
      await prisma.bookingGroup.update({
        where: { id: groupId },
        data: { paymentStatus: newPaymentStatus },
      })
    }

    return NextResponse.json({
      success: true,
      paymentStatus: newPaymentStatus,
      totalPaid: totalPaidEur,
    })
  } catch (error) {
    console.error('Error deleting group payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
