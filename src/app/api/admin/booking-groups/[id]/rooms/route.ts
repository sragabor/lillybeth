import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateNights, recalculateAndPersistRoomTotal } from '@/lib/pricing'

// Helper to get localized text from JSON field
function getLocalizedTitle(title: unknown): string {
  if (typeof title === 'object' && title !== null) {
    const titleObj = title as Record<string, string>
    return titleObj.en || titleObj.hu || ''
  }
  return String(title || '')
}

// Interface for price selection from client
interface PriceSelection {
  sourceId: string
  sourceType: 'building' | 'roomType'
}

// POST add a room to a booking group
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

    // Validate required fields
    if (!data.roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    }

    // Verify group exists
    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
      include: { bookings: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        roomType: {
          include: {
            building: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if room is already in this group
    const existingInGroup = group.bookings.find((b) => b.roomId === data.roomId)
    if (existingInGroup) {
      return NextResponse.json({ error: 'Room is already in this group' }, { status: 400 })
    }

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            checkIn: { lt: group.checkOut },
            checkOut: { gt: group.checkIn },
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json({
        error: `Room ${room.name} is already booked for these dates`
      }, { status: 400 })
    }

    // Create new booking linked to the group
    const newBooking = await prisma.booking.create({
      data: {
        roomId: data.roomId,
        groupId,
        guestCount: data.guestCount || 1,
        guestName: group.guestName,
        guestEmail: group.guestEmail,
        guestPhone: group.guestPhone,
        source: group.source,
        checkIn: group.checkIn,
        checkOut: group.checkOut,
        arrivalTime: group.arrivalTime,
        status: group.status,
        paymentStatus: 'PENDING',
        totalAmount: data.totalAmount || null,
        additionalPrices: {
          create: (data.additionalPrices || []).map((price: { title: string; priceEur: number; quantity: number }) => ({
            title: price.title,
            priceEur: price.priceEur,
            quantity: price.quantity || 1,
          })),
        },
      },
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
    })

    // Update group total if room has a price
    if (data.totalAmount) {
      const newGroupTotal = (group.totalAmount || 0) + parseFloat(data.totalAmount)
      await prisma.bookingGroup.update({
        where: { id: groupId },
        data: { totalAmount: newGroupTotal },
      })
    }

    return NextResponse.json({ booking: newBooking }, { status: 201 })
  } catch (error) {
    console.error('Error adding room to group:', error)
    return NextResponse.json({ error: 'Failed to add room to group' }, { status: 500 })
  }
}

// PUT update a room booking within a group (room assignment, guest count, additional prices)
export async function PUT(
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
    const { bookingId, roomId, guestCount, additionalPriceSelections } = data

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }

    // Verify group exists with full details
    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
      include: {
        bookings: {
          include: {
            additionalPrices: true,
            room: {
              include: {
                roomType: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Verify booking belongs to this group
    const booking = group.bookings.find((b) => b.id === bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found in this group' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const finalGuestCount = guestCount !== undefined ? guestCount : booking.guestCount

    // Handle room change
    if (roomId && roomId !== booking.roomId) {
      // Verify new room exists
      const newRoom = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          roomType: {
            include: {
              building: { select: { id: true, name: true } },
            },
          },
        },
      })

      if (!newRoom) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }

      // Check if new room is already in this group
      const existingInGroup = group.bookings.find((b) => b.roomId === roomId && b.id !== bookingId)
      if (existingInGroup) {
        return NextResponse.json({ error: 'Room is already in this group' }, { status: 400 })
      }

      // Check for overlapping bookings in the new room
      const overlapping = await prisma.booking.findFirst({
        where: {
          roomId,
          id: { not: bookingId },
          status: { not: 'CANCELLED' },
          OR: [
            {
              checkIn: { lt: group.checkOut },
              checkOut: { gt: group.checkIn },
            },
          ],
        },
      })

      if (overlapping) {
        return NextResponse.json({
          error: `Room ${newRoom.name} is already booked for these dates`
        }, { status: 400 })
      }

      updateData.roomId = roomId
    }

    // Handle guest count change
    if (guestCount !== undefined) {
      updateData.guestCount = guestCount
    }

    // Handle additional prices update with server-side calculation
    if (additionalPriceSelections !== undefined) {
      const nights = calculateNights(new Date(group.checkIn), new Date(group.checkOut))

      // Delete existing additional prices for this booking
      await prisma.bookingAdditionalPrice.deleteMany({
        where: { bookingId },
      })

      // Process each selection - fetch from source and calculate
      const priceSelections = additionalPriceSelections as PriceSelection[]

      for (const selection of priceSelections) {
        let sourceDef = null

        // Fetch the price definition from the appropriate source table
        if (selection.sourceType === 'building') {
          sourceDef = await prisma.buildingAdditionalPrice.findUnique({
            where: { id: selection.sourceId },
          })
        } else if (selection.sourceType === 'roomType') {
          sourceDef = await prisma.roomTypeAdditionalPrice.findUnique({
            where: { id: selection.sourceId },
          })
        }

        if (!sourceDef) {
          console.warn(`Price definition not found: ${selection.sourceType}/${selection.sourceId}`)
          continue
        }

        // Calculate quantity based on rules
        let quantity = 1
        if (sourceDef.perNight) {
          quantity = nights
        }
        if (sourceDef.perGuest) {
          quantity *= finalGuestCount
        }

        // Create with server-calculated values
        await prisma.bookingAdditionalPrice.create({
          data: {
            bookingId,
            title: getLocalizedTitle(sourceDef.title),
            priceEur: sourceDef.priceEur,
            quantity,
          },
        })
      }

    }

    // Update the booking (without totalAmount - will be calculated by pricing service)
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
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
    })

    // Use unified pricing service to recalculate and persist correct totals
    // This includes BOTH accommodation AND additional prices
    const { roomTotal, groupTotal } = await recalculateAndPersistRoomTotal(bookingId, groupId)

    return NextResponse.json({
      booking: {
        ...updatedBooking,
        totalAmount: roomTotal, // Return the correctly calculated total
      },
      groupTotal,
    })
  } catch (error) {
    console.error('Error updating room in group:', error)
    return NextResponse.json({ error: 'Failed to update room in group' }, { status: 500 })
  }
}

// DELETE remove a room from a booking group
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
  const bookingId = searchParams.get('bookingId')

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
  }

  try {
    // Verify group exists and get current bookings
    const group = await prisma.bookingGroup.findUnique({
      where: { id: groupId },
      include: { bookings: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Booking group not found' }, { status: 404 })
    }

    // Verify booking exists and belongs to this group
    const booking = group.bookings.find((b) => b.id === bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found in this group' }, { status: 404 })
    }

    // Check if this would leave the group with less than 2 rooms
    if (group.bookings.length <= 2) {
      // If only 2 rooms, removing one should convert the remaining to standalone
      const remainingBooking = group.bookings.find((b) => b.id !== bookingId)

      if (remainingBooking) {
        // Convert remaining booking to standalone
        await prisma.booking.update({
          where: { id: remainingBooking.id },
          data: { groupId: null },
        })

        // Move group payments to the remaining booking
        await prisma.payment.updateMany({
          where: { groupId },
          data: { groupId: null, bookingId: remainingBooking.id },
        })

        // Update remaining booking with group's guest info and total
        await prisma.booking.update({
          where: { id: remainingBooking.id },
          data: {
            totalAmount: remainingBooking.totalAmount, // Keep room-specific amount
            hasCustomHufPrice: group.hasCustomHufPrice,
            customHufPrice: group.customHufPrice,
            invoiceSent: group.invoiceSent,
            vendegem: group.vendegem,
            cleaned: group.cleaned,
          },
        })
      }

      // Delete the booking being removed
      await prisma.booking.delete({ where: { id: bookingId } })

      // Delete the now-empty group
      await prisma.bookingGroup.delete({ where: { id: groupId } })

      return NextResponse.json({
        success: true,
        message: 'Room removed. Group dissolved, remaining booking is now standalone.',
        convertedToStandalone: remainingBooking?.id,
      })
    }

    // More than 2 rooms: just remove the booking
    // Delete the booking
    await prisma.booking.delete({ where: { id: bookingId } })

    // Use unified pricing service to recalculate group total
    // Import dynamically to avoid circular dependency issues
    const { calculateGroupPricing } = await import('@/lib/pricing')
    const groupPricing = await calculateGroupPricing(groupId)

    await prisma.bookingGroup.update({
      where: { id: groupId },
      data: { totalAmount: groupPricing.groupGrandTotal > 0 ? groupPricing.groupGrandTotal : null },
    })

    return NextResponse.json({ success: true, groupTotal: groupPricing.groupGrandTotal })
  } catch (error) {
    console.error('Error removing room from group:', error)
    return NextResponse.json({ error: 'Failed to remove room from group' }, { status: 500 })
  }
}
