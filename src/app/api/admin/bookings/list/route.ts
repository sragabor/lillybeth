import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Unified list item type for both standalone bookings and groups
interface ListItem {
  type: 'standalone' | 'group'
  id: string
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  guestCount: number // Total guests (for groups: sum of all rooms)
  checkIn: Date
  checkOut: Date
  arrivalTime: string | null
  source: string
  status: string
  paymentStatus: string
  notes: string | null
  totalAmount: number | null
  hasCustomHufPrice: boolean
  customHufPrice: number | null
  invoiceSent: boolean
  vendegem: boolean
  cleaned: boolean
  nights: number
  roomCount: number // 1 for standalone, N for groups
  // For standalone: single room info
  room?: {
    id: string
    name: string
    roomType: {
      id: string
      name: unknown
      building: { id: string; name: string }
    } | null
  }
  // For groups: array of room bookings
  bookings?: {
    id: string
    roomId: string
    guestCount: number
    totalAmount: number | null
    room: {
      id: string
      name: string
      roomType: {
        id: string
        name: unknown
        building: { id: string; name: string }
      } | null
    }
    additionalPrices: { id: string; title: string; priceEur: number; quantity: number }[]
  }[]
  additionalPrices?: { id: string; title: string; priceEur: number; quantity: number }[]
}

// GET bookings list with filtering, sorting, and pagination
// Returns both standalone bookings and booking groups in a unified format
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Tab filter (all, upcoming, past)
  const tab = searchParams.get('tab') || 'all'

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'checkIn'
  const sortOrder = searchParams.get('sortOrder') || 'asc'

  // Filters
  const buildingId = searchParams.get('buildingId')
  const roomTypeId = searchParams.get('roomTypeId')
  const roomId = searchParams.get('roomId')
  const source = searchParams.get('source')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const guestName = searchParams.get('guestName')

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build where clause for STANDALONE bookings (groupId = null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standaloneWhere: any = {
      groupId: null, // Only standalone bookings
    }

    // Build where clause for GROUPS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupWhere: any = {}

    // Tab-based date filtering
    if (tab === 'upcoming') {
      standaloneWhere.checkIn = { gte: today }
      standaloneWhere.status = { not: 'CANCELLED' }
      groupWhere.checkIn = { gte: today }
      groupWhere.status = { not: 'CANCELLED' }
    } else if (tab === 'past') {
      standaloneWhere.checkOut = { lt: today }
      groupWhere.checkOut = { lt: today }
    }

    // Room filter - for groups, filter by bookings containing that room
    if (roomId) {
      standaloneWhere.roomId = roomId
      groupWhere.bookings = { some: { roomId } }
    }

    // Room Type filter
    if (roomTypeId && !roomId) {
      standaloneWhere.room = { roomTypeId }
      groupWhere.bookings = { some: { room: { roomTypeId } } }
    }

    // Building filter
    if (buildingId && !roomTypeId && !roomId) {
      standaloneWhere.room = { roomType: { buildingId } }
      groupWhere.bookings = { some: { room: { roomType: { buildingId } } } }
    }

    // Source filter
    if (source) {
      standaloneWhere.source = source
      groupWhere.source = source
    }

    // Guest name search
    if (guestName) {
      standaloneWhere.guestName = { contains: guestName, mode: 'insensitive' }
      groupWhere.guestName = { contains: guestName, mode: 'insensitive' }
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      standaloneWhere.AND = [
        { checkIn: { lte: end } },
        { checkOut: { gte: start } },
      ]
      groupWhere.AND = [
        { checkIn: { lte: end } },
        { checkOut: { gte: start } },
      ]
    } else if (startDate) {
      standaloneWhere.checkIn = { ...standaloneWhere.checkIn, gte: new Date(startDate) }
      groupWhere.checkIn = { ...groupWhere.checkIn, gte: new Date(startDate) }
    } else if (endDate) {
      standaloneWhere.checkOut = { ...standaloneWhere.checkOut, lte: new Date(endDate) }
      groupWhere.checkOut = { ...groupWhere.checkOut, lte: new Date(endDate) }
    }

    // Build orderBy clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = {}
    if (!searchParams.get('sortBy')) {
      orderBy = tab === 'past' ? { checkIn: 'desc' } : { checkIn: 'asc' }
    } else {
      const sortFieldMap: Record<string, string> = {
        guestName: 'guestName',
        checkIn: 'checkIn',
        guestCount: 'guestCount',
        totalAmount: 'totalAmount',
        createdAt: 'createdAt',
      }
      const field = sortFieldMap[sortBy] || 'checkIn'
      orderBy = { [field]: sortOrder }
    }

    // Fetch standalone bookings
    const standaloneBookings = await prisma.booking.findMany({
      where: standaloneWhere,
      include: {
        additionalPrices: true,
        room: {
          select: {
            id: true,
            name: true,
            roomType: {
              select: {
                id: true,
                name: true,
                building: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy,
    })

    // Fetch booking groups
    const bookingGroups = await prisma.bookingGroup.findMany({
      where: groupWhere,
      include: {
        bookings: {
          include: {
            additionalPrices: true,
            room: {
              select: {
                id: true,
                name: true,
                roomType: {
                  select: {
                    id: true,
                    name: true,
                    building: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy,
    })

    // Transform to unified list format
    const items: ListItem[] = []

    // Add standalone bookings
    for (const booking of standaloneBookings) {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

      items.push({
        type: 'standalone',
        id: booking.id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        guestCount: booking.guestCount,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        arrivalTime: booking.arrivalTime,
        source: booking.source,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        notes: booking.notes,
        totalAmount: booking.totalAmount,
        hasCustomHufPrice: booking.hasCustomHufPrice,
        customHufPrice: booking.customHufPrice,
        invoiceSent: booking.invoiceSent,
        vendegem: booking.vendegem,
        cleaned: booking.cleaned,
        nights,
        roomCount: 1,
        room: booking.room,
        additionalPrices: booking.additionalPrices,
      })
    }

    // Add booking groups
    for (const group of bookingGroups) {
      const checkIn = new Date(group.checkIn)
      const checkOut = new Date(group.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const totalGuests = group.bookings.reduce((sum, b) => sum + b.guestCount, 0)

      items.push({
        type: 'group',
        id: group.id,
        guestName: group.guestName,
        guestEmail: group.guestEmail,
        guestPhone: group.guestPhone,
        guestCount: totalGuests,
        checkIn: group.checkIn,
        checkOut: group.checkOut,
        arrivalTime: group.arrivalTime,
        source: group.source,
        status: group.status,
        paymentStatus: group.paymentStatus,
        notes: group.notes,
        totalAmount: group.totalAmount,
        hasCustomHufPrice: group.hasCustomHufPrice,
        customHufPrice: group.customHufPrice,
        invoiceSent: group.invoiceSent,
        vendegem: group.vendegem,
        cleaned: group.cleaned,
        nights,
        roomCount: group.bookings.length,
        bookings: group.bookings.map((b) => ({
          id: b.id,
          roomId: b.roomId,
          guestCount: b.guestCount,
          totalAmount: b.totalAmount,
          room: b.room,
          additionalPrices: b.additionalPrices,
        })),
      })
    }

    // Sort combined list
    const sortField = sortBy as keyof ListItem
    items.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle dates
      if (aVal instanceof Date) aVal = aVal.getTime()
      if (bVal instanceof Date) bVal = bVal.getTime()

      // Handle nulls
      if (aVal === null || aVal === undefined) aVal = sortOrder === 'asc' ? Infinity : -Infinity
      if (bVal === null || bVal === undefined) bVal = sortOrder === 'asc' ? Infinity : -Infinity

      // Handle strings
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    // Apply pagination to combined list
    const total = items.length
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages
    const skip = (page - 1) * limit
    const paginatedItems = items.slice(skip, skip + limit)

    return NextResponse.json({
      bookings: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching bookings list:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
