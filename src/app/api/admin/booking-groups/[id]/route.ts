import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET a specific booking group with all details
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
    const group = await prisma.bookingGroup.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            room: {
              include: {
                roomType: {
                  include: {
                    building: { select: { id: true, name: true } },
                  },
                },
              },
            },
            additionalPrices: true,
          },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Calculate stats
    const totalGuests = group.bookings.reduce((sum, b) => sum + b.guestCount, 0)
    const roomCount = group.bookings.length
    const nights = Math.ceil(
      (new Date(group.checkOut).getTime() - new Date(group.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate payment summary
    const paidEur = group.payments
      .filter((p) => p.currency === 'EUR')
      .reduce((sum, p) => sum + p.amount, 0)
    const paidHuf = group.payments
      .filter((p) => p.currency === 'HUF')
      .reduce((sum, p) => sum + p.amount, 0)
    const remaining = (group.totalAmount || 0) - paidEur

    return NextResponse.json({
      group: {
        ...group,
        totalGuests,
        roomCount,
        nights,
      },
      paymentSummary: {
        totalAmount: group.totalAmount,
        hasCustomHufPrice: group.hasCustomHufPrice,
        customHufPrice: group.customHufPrice,
        paidEur,
        paidHuf,
        remaining: remaining > 0 ? remaining : 0,
        paymentStatus: group.paymentStatus,
      },
    })
  } catch (error) {
    console.error('Error fetching booking group:', error)
    return NextResponse.json({ error: 'Failed to fetch booking group' }, { status: 500 })
  }
}

// PUT update a booking group (guest info, dates, etc.)
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

    // Verify group exists
    const existingGroup = await prisma.bookingGroup.findUnique({
      where: { id },
      include: { bookings: true },
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Build update data for group
    const updateData: Record<string, unknown> = {}

    if (data.guestName !== undefined) updateData.guestName = data.guestName
    if (data.guestEmail !== undefined) updateData.guestEmail = data.guestEmail || null
    if (data.guestPhone !== undefined) updateData.guestPhone = data.guestPhone || null
    if (data.source !== undefined) updateData.source = data.source
    if (data.arrivalTime !== undefined) updateData.arrivalTime = data.arrivalTime || null
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount ? parseFloat(data.totalAmount) : null
    if (data.hasCustomHufPrice !== undefined) updateData.hasCustomHufPrice = data.hasCustomHufPrice
    if (data.customHufPrice !== undefined) updateData.customHufPrice = data.customHufPrice ? parseFloat(data.customHufPrice) : null
    if (data.invoiceSent !== undefined) updateData.invoiceSent = data.invoiceSent
    if (data.vendegem !== undefined) updateData.vendegem = data.vendegem
    if (data.cleaned !== undefined) updateData.cleaned = data.cleaned

    // Handle date changes - must update all child bookings too
    let newCheckIn = existingGroup.checkIn
    let newCheckOut = existingGroup.checkOut

    if (data.checkIn !== undefined) {
      newCheckIn = new Date(data.checkIn)
      updateData.checkIn = newCheckIn
    }
    if (data.checkOut !== undefined) {
      newCheckOut = new Date(data.checkOut)
      updateData.checkOut = newCheckOut
    }

    // Validate dates
    if (newCheckOut <= newCheckIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Check for conflicts if dates changed
    if (data.checkIn !== undefined || data.checkOut !== undefined) {
      for (const booking of existingGroup.bookings) {
        const overlapping = await prisma.booking.findFirst({
          where: {
            roomId: booking.roomId,
            id: { not: booking.id },
            status: { not: 'CANCELLED' },
            OR: [
              {
                checkIn: { lt: newCheckOut },
                checkOut: { gt: newCheckIn },
              },
            ],
          },
        })

        if (overlapping) {
          return NextResponse.json({
            error: `Date change conflicts with existing booking in one of the rooms`
          }, { status: 400 })
        }
      }
    }

    // Update group
    const updatedGroup = await prisma.bookingGroup.update({
      where: { id },
      data: updateData,
      include: {
        bookings: {
          include: {
            room: {
              include: {
                roomType: {
                  include: {
                    building: { select: { id: true, name: true } },
                  },
                },
              },
            },
            additionalPrices: true,
          },
        },
        payments: true,
      },
    })

    // If dates or guest info changed, update all child bookings too
    if (data.checkIn !== undefined || data.checkOut !== undefined ||
        data.guestName !== undefined || data.guestEmail !== undefined ||
        data.guestPhone !== undefined || data.arrivalTime !== undefined ||
        data.status !== undefined) {

      const bookingUpdateData: Record<string, unknown> = {}
      if (data.checkIn !== undefined) bookingUpdateData.checkIn = newCheckIn
      if (data.checkOut !== undefined) bookingUpdateData.checkOut = newCheckOut
      if (data.guestName !== undefined) bookingUpdateData.guestName = data.guestName
      if (data.guestEmail !== undefined) bookingUpdateData.guestEmail = data.guestEmail || null
      if (data.guestPhone !== undefined) bookingUpdateData.guestPhone = data.guestPhone || null
      if (data.arrivalTime !== undefined) bookingUpdateData.arrivalTime = data.arrivalTime || null
      if (data.status !== undefined) bookingUpdateData.status = data.status

      if (Object.keys(bookingUpdateData).length > 0) {
        await prisma.booking.updateMany({
          where: { groupId: id },
          data: bookingUpdateData,
        })
      }
    }

    return NextResponse.json({ group: updatedGroup })
  } catch (error) {
    console.error('Error updating booking group:', error)
    return NextResponse.json({ error: 'Failed to update booking group' }, { status: 500 })
  }
}

// DELETE a booking group (and all its bookings)
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
    // Verify group exists
    const group = await prisma.bookingGroup.findUnique({
      where: { id },
    })

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Delete group (cascade will delete bookings and payments)
    await prisma.bookingGroup.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking group:', error)
    return NextResponse.json({ error: 'Failed to delete booking group' }, { status: 500 })
  }
}
