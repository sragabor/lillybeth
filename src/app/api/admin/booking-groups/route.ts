import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET all booking groups (with their room bookings)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const buildingId = searchParams.get('buildingId')

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // Date range filter
    if (startDate && endDate) {
      where.OR = [
        {
          checkIn: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          checkOut: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { checkIn: { lte: new Date(startDate) } },
            { checkOut: { gte: new Date(endDate) } },
          ],
        },
      ]
    }

    // Building filter (through bookings -> room -> roomType -> building)
    if (buildingId) {
      where.bookings = {
        some: {
          room: {
            roomType: {
              buildingId,
            },
          },
        },
      }
    }

    const groups = await prisma.bookingGroup.findMany({
      where,
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
      orderBy: { checkIn: 'asc' },
    })

    // Calculate aggregated data for each group
    const groupsWithStats = groups.map((group) => {
      const totalGuests = group.bookings.reduce((sum, b) => sum + b.guestCount, 0)
      const roomCount = group.bookings.length

      return {
        ...group,
        totalGuests,
        roomCount,
      }
    })

    return NextResponse.json({ groups: groupsWithStats })
  } catch (error) {
    console.error('Error fetching booking groups:', error)
    return NextResponse.json({ error: 'Failed to fetch booking groups' }, { status: 500 })
  }
}

// POST create a new booking group with initial room bookings
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Validate required fields
    if (!data.guestName || !data.checkIn || !data.checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate rooms array
    if (!Array.isArray(data.rooms) || data.rooms.length < 2) {
      return NextResponse.json({ error: 'A booking group requires at least 2 rooms' }, { status: 400 })
    }

    const checkIn = new Date(data.checkIn)
    const checkOut = new Date(data.checkOut)

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Validate all rooms exist and check for conflicts
    for (const roomData of data.rooms) {
      if (!roomData.roomId) {
        return NextResponse.json({ error: 'Each room must have a roomId' }, { status: 400 })
      }

      const room = await prisma.room.findUnique({
        where: { id: roomData.roomId },
      })

      if (!room) {
        return NextResponse.json({ error: `Room ${roomData.roomId} not found` }, { status: 404 })
      }

      // Check for overlapping bookings
      const overlapping = await prisma.booking.findFirst({
        where: {
          roomId: roomData.roomId,
          status: { not: 'CANCELLED' },
          OR: [
            {
              checkIn: { lt: checkOut },
              checkOut: { gt: checkIn },
            },
          ],
        },
      })

      if (overlapping) {
        return NextResponse.json({
          error: `Room ${room.name} is already booked for these dates`
        }, { status: 400 })
      }
    }

    // Calculate total amount from rooms
    let groupTotalAmount = 0
    const roomsWithTotals = data.rooms.map((roomData: { roomId: string; guestCount: number; totalAmount?: number; additionalPrices?: { title: string; priceEur: number; quantity: number }[] }) => {
      const roomTotal = roomData.totalAmount || 0
      groupTotalAmount += roomTotal
      return roomData
    })

    // Create the booking group with all room bookings
    const group = await prisma.bookingGroup.create({
      data: {
        guestName: data.guestName,
        guestEmail: data.guestEmail || null,
        guestPhone: data.guestPhone || null,
        source: data.source || 'MANUAL',
        checkIn,
        checkOut,
        arrivalTime: data.arrivalTime || null,
        notes: data.notes || null,
        status: data.status || 'INCOMING',
        paymentStatus: data.paymentStatus || 'PENDING',
        totalAmount: data.totalAmount ?? groupTotalAmount,
        hasCustomHufPrice: data.hasCustomHufPrice || false,
        customHufPrice: data.customHufPrice || null,
        invoiceSent: data.invoiceSent || false,
        vendegem: data.vendegem || false,
        cleaned: data.cleaned || false,
        bookings: {
          create: roomsWithTotals.map((roomData: { roomId: string; guestCount: number; totalAmount?: number; additionalPrices?: { title: string; priceEur: number; quantity: number }[] }) => ({
            roomId: roomData.roomId,
            guestCount: roomData.guestCount || 1,
            guestName: data.guestName, // Duplicated for backwards compat, but group is source of truth
            guestEmail: data.guestEmail || null,
            guestPhone: data.guestPhone || null,
            source: data.source || 'MANUAL',
            checkIn,
            checkOut,
            arrivalTime: data.arrivalTime || null,
            status: data.status || 'INCOMING',
            paymentStatus: 'PENDING', // Individual room payment status
            totalAmount: roomData.totalAmount || null,
            additionalPrices: {
              create: (roomData.additionalPrices || []).map((price: { title: string; priceEur: number; quantity: number }) => ({
                title: price.title,
                priceEur: price.priceEur,
                quantity: price.quantity || 1,
              })),
            },
          })),
        },
      },
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

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking group:', error)
    return NextResponse.json({ error: 'Failed to create booking group' }, { status: 500 })
  }
}
