'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Types
interface Building {
  id: string
  name: string
  roomTypes: RoomType[]
}

interface RoomType {
  id: string
  name: string
  rooms: Room[]
}

interface Room {
  id: string
  name: string
  isActive: boolean
  roomType?: {
    id: string
    name: string
    building: {
      id: string
      name: string
    }
  }
}

interface BookingAdditionalPrice {
  id: string
  title: string
  priceEur: number
  quantity: number
}

interface Booking {
  id: string
  source: 'WEBSITE' | 'BOOKING_COM' | 'SZALLAS_HU' | 'AIRBNB'
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string
  status: 'INCOMING' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'REFUNDED'
  notes: string | null
  totalAmount: number | null
  roomId: string
  room: Room
  additionalPrices: BookingAdditionalPrice[]
}

interface TimelineData {
  buildings: Building[]
  bookings: Booking[]
  bookingsByRoom: Record<string, Booking[]>
}

// Constants
const DAY_WIDTH = 120 // pixels per day
const ROOM_HEIGHT = 50 // pixels per room row
const ROOM_COLUMN_WIDTH = 200 // left sidebar width
const HEADER_HEIGHT = 60 // top header height

const SOURCE_COLORS = {
  WEBSITE: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', badge: 'bg-yellow-400' },
  BOOKING_COM: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', badge: 'bg-blue-400' },
  SZALLAS_HU: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-400' },
  AIRBNB: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', badge: 'bg-red-400' },
}

const SOURCE_LABELS = {
  WEBSITE: 'Website',
  BOOKING_COM: 'Booking.com',
  SZALLAS_HU: 'Szállás.hu',
  AIRBNB: 'Airbnb',
}

const STATUS_COLORS = {
  INCOMING: 'opacity-60',
  CONFIRMED: 'opacity-100',
  CANCELLED: 'opacity-30 line-through',
}

const PAYMENT_LABELS = {
  PENDING: 'Pending',
  DEPOSIT_PAID: 'Deposit Paid',
  FULLY_PAID: 'Fully Paid',
  REFUNDED: 'Refunded',
}

export default function BookingsPage() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    today.setDate(today.getDate() - 3) // Start 3 days ago
    return today.toISOString().split('T')[0]
  })
  const [daysToShow, setDaysToShow] = useState(30)

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Hover state
  const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Form state
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    source: 'WEBSITE' as Booking['source'],
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: '1',
    checkIn: '',
    checkOut: '',
    status: 'INCOMING' as Booking['status'],
    paymentStatus: 'PENDING' as Booking['paymentStatus'],
    notes: '',
    totalAmount: '',
  })

  // Available rooms for booking form
  const [availableRooms, setAvailableRooms] = useState<{ room: Room; building: string; roomType: string }[]>([])

  const endDate = useCallback(() => {
    const end = new Date(startDate)
    end.setDate(end.getDate() + daysToShow)
    return end.toISOString().split('T')[0]
  }, [startDate, daysToShow])

  const fetchTimelineData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings/timeline?startDate=${startDate}&endDate=${endDate()}`)
      const data = await res.json()
      setTimelineData(data)

      // Build available rooms list
      const rooms: { room: Room; building: string; roomType: string }[] = []
      data.buildings?.forEach((building: Building) => {
        building.roomTypes.forEach((roomType) => {
          roomType.rooms.forEach((room) => {
            rooms.push({
              room,
              building: building.name,
              roomType: roomType.name,
            })
          })
        })
      })
      setAvailableRooms(rooms)
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchTimelineData()
  }, [fetchTimelineData])

  // Generate dates array
  const generateDates = () => {
    const dates: Date[] = []
    const current = new Date(startDate)
    for (let i = 0; i < daysToShow; i++) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const dates = generateDates()

  // Calculate booking position
  const getBookingPosition = (booking: Booking) => {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const timelineStart = new Date(startDate)

    // Calculate days from start
    const startDiff = Math.floor((checkIn.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    const endDiff = Math.floor((checkOut.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))

    // Half-day offsets: check-in at 14:00 (start from middle), check-out at 10:00 (end at middle)
    const left = startDiff * DAY_WIDTH + DAY_WIDTH / 2 // Start from middle of check-in day
    const width = (endDiff - startDiff) * DAY_WIDTH // Full days between

    return { left, width }
  }

  // Navigate timeline
  const navigateDays = (days: number) => {
    const newDate = new Date(startDate)
    newDate.setDate(newDate.getDate() + days)
    setStartDate(newDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    const today = new Date()
    today.setDate(today.getDate() - 3)
    setStartDate(today.toISOString().split('T')[0])

    // Scroll to today
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 3 * DAY_WIDTH - 50
    }
  }

  // Open booking modal
  const openCreateBooking = (roomId?: string, date?: string) => {
    setEditingBooking(null)
    setBookingForm({
      roomId: roomId || '',
      source: 'WEBSITE',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      guestCount: '1',
      checkIn: date || new Date().toISOString().split('T')[0],
      checkOut: date ? new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0] : '',
      status: 'INCOMING',
      paymentStatus: 'PENDING',
      notes: '',
      totalAmount: '',
    })
    setShowBookingModal(true)
  }

  const openEditBooking = (booking: Booking) => {
    setEditingBooking(booking)
    setBookingForm({
      roomId: booking.roomId,
      source: booking.source,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail || '',
      guestPhone: booking.guestPhone || '',
      guestCount: booking.guestCount.toString(),
      checkIn: booking.checkIn.split('T')[0],
      checkOut: booking.checkOut.split('T')[0],
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      notes: booking.notes || '',
      totalAmount: booking.totalAmount?.toString() || '',
    })
    setShowBookingModal(true)
    setHoveredBooking(null)
  }

  // Save booking
  const handleSaveBooking = async () => {
    try {
      const url = editingBooking
        ? `/api/admin/bookings/${editingBooking.id}`
        : '/api/admin/bookings'
      const method = editingBooking ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm),
      })

      if (res.ok) {
        setShowBookingModal(false)
        fetchTimelineData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save booking')
      }
    } catch (error) {
      console.error('Error saving booking:', error)
    }
  }

  // Delete booking
  const handleDeleteBooking = async () => {
    if (!editingBooking) return
    if (!confirm('Are you sure you want to delete this booking?')) return

    try {
      const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowBookingModal(false)
        fetchTimelineData()
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  // Handle hover
  const handleBookingHover = (booking: Booking, e: React.MouseEvent) => {
    setHoveredBooking(booking)
    setHoverPosition({ x: e.clientX, y: e.clientY })
  }

  // Get all rooms flattened
  const getAllRooms = () => {
    if (!timelineData) return []
    const rooms: { room: Room; buildingName: string; roomTypeName: string }[] = []
    timelineData.buildings.forEach((building) => {
      building.roomTypes.forEach((roomType) => {
        roomType.rooms.forEach((room) => {
          rooms.push({
            room,
            buildingName: building.name,
            roomTypeName: roomType.name,
          })
        })
      })
    })
    return rooms
  }

  const allRooms = getAllRooms()

  if (loading && !timelineData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Booking Timeline</h1>
          <p className="text-stone-600 mt-1">View and manage all bookings</p>
        </div>
        <button
          onClick={() => openCreateBooking()}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          Add Booking
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDays(-7)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              title="Previous week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateDays(-1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              title="Previous day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateDays(1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              title="Next day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigateDays(7)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              title="Next week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />

          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(parseInt(e.target.value))}
            className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
            <option value={60}>2 months</option>
            <option value={90}>3 months</option>
          </select>

          {/* Legend */}
          <div className="flex items-center gap-4 ml-auto text-sm">
            {Object.entries(SOURCE_COLORS).map(([source, colors]) => (
              <div key={source} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${colors.badge}`} />
                <span className="text-stone-600">{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex h-[700px] bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="relative w-full h-full" ref={timelineRef}>
          {/* Fixed corner */}
          <div
            className="absolute top-0 left-0 bg-white border-b border-r border-stone-200 z-30 flex items-center justify-center"
            style={{ width: ROOM_COLUMN_WIDTH, height: HEADER_HEIGHT }}
          >
            <span className="text-sm font-medium text-stone-600">Rooms</span>
          </div>

          {/* Fixed header (dates) */}
          <div
            className="absolute top-0 bg-white border-b border-stone-200 z-20 overflow-hidden"
            style={{ left: ROOM_COLUMN_WIDTH, right: 0, height: HEADER_HEIGHT }}
          >
            <div
              ref={scrollContainerRef}
              className="h-full overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
              onScroll={(e) => {
                // Sync scroll with main content
                const target = e.target as HTMLDivElement
                const mainContent = document.getElementById('timeline-content')
                if (mainContent) {
                  mainContent.scrollLeft = target.scrollLeft
                }
              }}
            >
              <div className="flex" style={{ width: dates.length * DAY_WIDTH }}>
                {dates.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 border-r border-stone-200 flex flex-col items-center justify-center ${
                        isToday ? 'bg-amber-50' : isWeekend ? 'bg-stone-50' : ''
                      }`}
                      style={{ width: DAY_WIDTH, height: HEADER_HEIGHT }}
                    >
                      <span className="text-xs text-stone-500">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={`text-sm font-medium ${isToday ? 'text-amber-600' : 'text-stone-900'}`}>
                        {date.getDate()}
                      </span>
                      <span className="text-xs text-stone-500">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Fixed left column (rooms) */}
          <div
            className="absolute left-0 bg-white border-r border-stone-200 z-20 overflow-y-auto"
            style={{ top: HEADER_HEIGHT, bottom: 0, width: ROOM_COLUMN_WIDTH, scrollbarWidth: 'none' }}
            onScroll={(e) => {
              // Sync scroll with main content
              const target = e.target as HTMLDivElement
              const mainContent = document.getElementById('timeline-content')
              if (mainContent) {
                mainContent.scrollTop = target.scrollTop
              }
            }}
          >
            {allRooms.map(({ room, buildingName, roomTypeName }, index) => (
              <div
                key={room.id}
                className={`border-b border-stone-100 px-3 flex items-center ${
                  !room.isActive ? 'bg-stone-50' : ''
                }`}
                style={{ height: ROOM_HEIGHT }}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${!room.isActive ? 'text-stone-400' : 'text-stone-900'}`}>
                    {room.name}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {buildingName} / {roomTypeName}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Main content area */}
          <div
            id="timeline-content"
            className="absolute overflow-auto"
            style={{
              top: HEADER_HEIGHT,
              left: ROOM_COLUMN_WIDTH,
              right: 0,
              bottom: 0,
            }}
            onScroll={(e) => {
              // Sync scroll with header and sidebar
              const target = e.target as HTMLDivElement
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = target.scrollLeft
              }
              const sidebar = document.querySelector('[data-room-sidebar]') as HTMLDivElement
              if (sidebar) {
                sidebar.scrollTop = target.scrollTop
              }
            }}
          >
            <div
              className="relative"
              style={{
                width: dates.length * DAY_WIDTH,
                height: allRooms.length * ROOM_HEIGHT,
              }}
            >
              {/* Grid lines */}
              {dates.map((date, index) => {
                const isToday = date.toDateString() === new Date().toDateString()
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                return (
                  <div
                    key={`grid-${index}`}
                    className={`absolute top-0 bottom-0 border-r border-stone-100 ${
                      isToday ? 'bg-amber-50/50' : isWeekend ? 'bg-stone-50/50' : ''
                    }`}
                    style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
                  />
                )
              })}

              {/* Room row lines */}
              {allRooms.map((_, index) => (
                <div
                  key={`row-${index}`}
                  className="absolute left-0 right-0 border-b border-stone-100"
                  style={{ top: (index + 1) * ROOM_HEIGHT }}
                />
              ))}

              {/* Click areas for creating bookings */}
              {allRooms.map(({ room }, roomIndex) => (
                dates.map((date, dateIndex) => (
                  <div
                    key={`click-${room.id}-${dateIndex}`}
                    className="absolute cursor-pointer hover:bg-stone-100/50 transition-colors"
                    style={{
                      left: dateIndex * DAY_WIDTH,
                      top: roomIndex * ROOM_HEIGHT,
                      width: DAY_WIDTH,
                      height: ROOM_HEIGHT,
                    }}
                    onClick={() => openCreateBooking(room.id, date.toISOString().split('T')[0])}
                  />
                ))
              ))}

              {/* Bookings */}
              {allRooms.map(({ room }, roomIndex) => {
                const roomBookings = timelineData?.bookingsByRoom[room.id] || []
                return roomBookings.map((booking) => {
                  const { left, width } = getBookingPosition(booking)
                  const colors = SOURCE_COLORS[booking.source]
                  const statusClass = STATUS_COLORS[booking.status]

                  // Check if booking is within visible range
                  if (left + width < 0 || left > dates.length * DAY_WIDTH) return null

                  return (
                    <div
                      key={booking.id}
                      className={`absolute rounded-lg border-2 ${colors.bg} ${colors.border} ${statusClass} cursor-pointer transition-all hover:shadow-lg hover:z-10`}
                      style={{
                        left: Math.max(0, left),
                        top: roomIndex * ROOM_HEIGHT + 4,
                        width: Math.min(width, dates.length * DAY_WIDTH - left),
                        height: ROOM_HEIGHT - 8,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditBooking(booking)
                      }}
                      onMouseEnter={(e) => handleBookingHover(booking, e)}
                      onMouseLeave={() => setHoveredBooking(null)}
                    >
                      <div className="h-full px-2 py-1 flex items-center gap-2 overflow-hidden">
                        {/* Source badge */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.badge}`} />

                        {/* Guest info */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-medium truncate ${colors.text}`}>
                            {booking.guestName}
                          </p>
                          <p className={`text-xs truncate ${colors.text} opacity-70`}>
                            {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {booking.notes && (
                            <svg className={`w-3 h-3 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          )}
                          {booking.additionalPrices.length > 0 && (
                            <svg className={`w-3 h-3 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              })}

              {/* Today line */}
              {(() => {
                const today = new Date()
                const timelineStart = new Date(startDate)
                const daysDiff = Math.floor((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
                if (daysDiff >= 0 && daysDiff < daysToShow) {
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                      style={{ left: daysDiff * DAY_WIDTH + DAY_WIDTH / 2 }}
                    />
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Popup */}
      {hoveredBooking && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-200 p-4 w-72 pointer-events-none"
          style={{
            left: Math.min(hoverPosition.x + 10, window.innerWidth - 300),
            top: Math.min(hoverPosition.y + 10, window.innerHeight - 300),
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${SOURCE_COLORS[hoveredBooking.source].badge}`} />
            <span className="text-xs font-medium text-stone-600">
              {SOURCE_LABELS[hoveredBooking.source]}
            </span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              hoveredBooking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-700'
            }`}>
              {hoveredBooking.status}
            </span>
          </div>

          <h4 className="font-semibold text-stone-900">{hoveredBooking.guestName}</h4>

          <div className="mt-2 space-y-1 text-sm text-stone-600">
            <p>{hoveredBooking.guestCount} guest{hoveredBooking.guestCount !== 1 ? 's' : ''}</p>
            <p>
              {new Date(hoveredBooking.checkIn).toLocaleDateString()} - {new Date(hoveredBooking.checkOut).toLocaleDateString()}
            </p>
            <p>Room: {hoveredBooking.room.name}</p>
            {hoveredBooking.guestEmail && <p>{hoveredBooking.guestEmail}</p>}
            {hoveredBooking.guestPhone && <p>{hoveredBooking.guestPhone}</p>}
          </div>

          {hoveredBooking.notes && (
            <div className="mt-2 p-2 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-600">{hoveredBooking.notes}</p>
            </div>
          )}

          {hoveredBooking.additionalPrices.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-stone-700">Additional Prices:</p>
              {hoveredBooking.additionalPrices.map((price, i) => (
                <p key={i} className="text-xs text-stone-600">
                  {price.title}: {price.priceEur} EUR x{price.quantity}
                </p>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-stone-200 flex justify-between text-sm">
            <span className="text-stone-600">Payment: {PAYMENT_LABELS[hoveredBooking.paymentStatus]}</span>
            {hoveredBooking.totalAmount && (
              <span className="font-semibold text-stone-900">{hoveredBooking.totalAmount} EUR</span>
            )}
          </div>

          <p className="mt-2 text-xs text-amber-600">Click to view details</p>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              {editingBooking ? 'Edit Booking' : 'New Booking'}
            </h3>

            <div className="space-y-4">
              {/* Room Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Room</label>
                <select
                  value={bookingForm.roomId}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Select a room</option>
                  {availableRooms.map(({ room, building, roomType }) => (
                    <option key={room.id} value={room.id}>
                      {building} / {roomType} / {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Source</label>
                <select
                  value={bookingForm.source}
                  onChange={(e) => setBookingForm({ ...bookingForm, source: e.target.value as Booking['source'] })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="WEBSITE">Website</option>
                  <option value="BOOKING_COM">Booking.com</option>
                  <option value="SZALLAS_HU">Szállás.hu</option>
                  <option value="AIRBNB">Airbnb</option>
                </select>
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Guest Name</label>
                <input
                  type="text"
                  value={bookingForm.guestName}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Guest Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={bookingForm.guestEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={bookingForm.guestPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  value={bookingForm.guestCount}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestCount: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as Booking['status'] })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="INCOMING">Incoming</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={bookingForm.paymentStatus}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value as Booking['paymentStatus'] })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="DEPOSIT_PAID">Deposit Paid</option>
                    <option value="FULLY_PAID">Fully Paid</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Total Amount (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={bookingForm.totalAmount}
                  onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              {editingBooking ? (
                <button
                  onClick={handleDeleteBooking}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBooking}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                >
                  {editingBooking ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
