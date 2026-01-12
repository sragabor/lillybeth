'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Building,
  RoomType,
  Room,
  Booking,
  AvailableRoom,
  SOURCE_COLORS,
  SOURCE_LABELS,
  SOURCE_ICONS,
  STATUS_COLORS,
  STATUS_LABELS,
  PAYMENT_LABELS,
  PAYMENT_COLORS,
} from '../types'
import BookingModal from './BookingModal'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface TimelineData {
  buildings: Building[]
  bookings: Booking[]
  bookingsByRoom: Record<string, Booking[]>
  roomToRoomType: Record<string, string>
  inactiveDaysByRoomType: Record<string, string[]>
}

type TimelineRow =
  | { type: 'building'; building: Building }
  | { type: 'roomType'; roomType: RoomType; buildingName: string }
  | { type: 'room'; room: Room; roomTypeName: string; roomTypeId: string; buildingName: string }

// Constants
const DAY_WIDTH = 120
const ROOM_HEIGHT = 50
const HEADER_ROW_HEIGHT = 36
const ROOM_COLUMN_WIDTH = 200
const HEADER_HEIGHT = 60

// Timeline-specific status colors (opacity-based for booking bars)
const TIMELINE_STATUS_OPACITY = {
  INCOMING: 'opacity-60',
  CONFIRMED: 'opacity-100',
  CHECKED_IN: 'opacity-100',
  CHECKED_OUT: 'opacity-80',
  CANCELLED: 'opacity-30 line-through',
}

interface TimelineViewProps {
  filterBuildingId?: string
  filterRoomTypeId?: string
  filterSource?: string
}

export default function TimelineView({
  filterBuildingId,
  filterRoomTypeId,
  filterSource,
}: TimelineViewProps) {
  const { language } = useLanguage()
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
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

  // Available rooms for booking form
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])

  // Drag and drop state
  const [draggingBooking, setDraggingBooking] = useState<Booking | null>(null)
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  // Drag & drop price change warning
  const [showDragWarningModal, setShowDragWarningModal] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<{
    booking: Booking
    roomId: string
    newCheckIn: string
    newCheckOut: string
    oldPrice: number | null
    newPrice: number | null
  } | null>(null)

  const endDate = useCallback(() => {
    const end = new Date(startDate)
    end.setDate(end.getDate() + daysToShow)
    return end.toISOString().split('T')[0]
  }, [startDate, daysToShow])

  const fetchTimelineData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate: endDate(),
      })
      if (filterBuildingId) params.set('buildingId', filterBuildingId)

      const res = await fetch(`/api/admin/bookings/timeline?${params}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        console.error('Timeline API error:', data.error)
        setTimelineData(null)
        return
      }

      // Filter data based on filters
      let filteredData = { ...data }

      if (filterRoomTypeId || filterSource) {
        // Filter bookings
        filteredData.bookings = data.bookings.filter((b: Booking) => {
          if (filterRoomTypeId && b.room.roomType?.id !== filterRoomTypeId) return false
          if (filterSource && b.source !== filterSource) return false
          return true
        })

        // Rebuild bookingsByRoom
        filteredData.bookingsByRoom = {}
        filteredData.bookings.forEach((booking: Booking) => {
          if (!filteredData.bookingsByRoom[booking.roomId]) {
            filteredData.bookingsByRoom[booking.roomId] = []
          }
          filteredData.bookingsByRoom[booking.roomId].push(booking)
        })
      }

      setTimelineData(filteredData)

      // Build available rooms list
      const rooms: AvailableRoom[] = []
      data.buildings?.forEach((building: Building) => {
        building.roomTypes?.forEach((roomType) => {
          roomType.rooms?.forEach((room) => {
            rooms.push({
              room,
              building: building.name,
              roomType: getLocalizedText(roomType.name, language),
              capacity: roomType.capacity,
            })
          })
        })
      })
      setAvailableRooms(rooms)
    } catch (error) {
      console.error('Error fetching timeline:', error)
      setTimelineData(null)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, filterBuildingId, filterRoomTypeId, filterSource])

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

    const startDiff = Math.floor((checkIn.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    const endDiff = Math.floor((checkOut.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))

    const left = startDiff * DAY_WIDTH + DAY_WIDTH / 2
    const width = (endDiff - startDiff) * DAY_WIDTH

    return { left, width }
  }

  // Navigate timeline
  const navigateDays = (days: number) => {
    const newDate = new Date(startDate)
    newDate.setDate(newDate.getDate() + days)
    setStartDate(newDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setStartDate(yesterday.toISOString().split('T')[0])

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = DAY_WIDTH - 50
    }
  }

  // Open booking modal
  const openCreateBooking = (roomId?: string, date?: string) => {
    setEditingBooking(null)
    setSelectedRoomId(roomId || null)
    setSelectedDate(date || null)
    setShowBookingModal(true)
  }

  const openEditBooking = (booking: Booking) => {
    setEditingBooking(booking)
    setSelectedRoomId(null)
    setSelectedDate(null)
    setShowBookingModal(true)
    setHoveredBooking(null)
  }

  // Handle hover
  const handleBookingHover = (booking: Booking, e: React.MouseEvent) => {
    if (draggingBooking) return
    setHoveredBooking(booking)
    setHoverPosition({ x: e.clientX, y: e.clientY })
  }

  // Drag and drop handlers
  const handleDragStart = (booking: Booking, e: React.DragEvent) => {
    setDraggingBooking(booking)
    setHoveredBooking(null)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', booking.id)
  }

  const handleDragEnd = () => {
    setDraggingBooking(null)
    setDragOverRoom(null)
    setDragOverDate(null)
  }

  const handleDragOver = (roomId: string, date: string, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverRoom(roomId)
    setDragOverDate(date)
  }

  const handleDragLeave = () => {
    setDragOverRoom(null)
    setDragOverDate(null)
  }

  const handleDrop = async (roomId: string, date: string, e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingBooking) return

    const originalCheckIn = new Date(draggingBooking.checkIn)
    const originalCheckOut = new Date(draggingBooking.checkOut)
    const nights = Math.ceil((originalCheckOut.getTime() - originalCheckIn.getTime()) / (1000 * 60 * 60 * 24))

    const newCheckIn = new Date(date)
    const newCheckOut = new Date(date)
    newCheckOut.setDate(newCheckOut.getDate() + nights)

    const newCheckInStr = newCheckIn.toISOString().split('T')[0]
    const newCheckOutStr = newCheckOut.toISOString().split('T')[0]

    try {
      const res = await fetch('/api/admin/bookings/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn: newCheckInStr,
          checkOut: newCheckOutStr,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newPrice = data.breakdown.grandTotal
        const oldPrice = draggingBooking.totalAmount

        if (oldPrice !== null && Math.abs(newPrice - oldPrice) > 0.01) {
          setPendingDrop({
            booking: draggingBooking,
            roomId,
            newCheckIn: newCheckInStr,
            newCheckOut: newCheckOutStr,
            oldPrice,
            newPrice,
          })
          setShowDragWarningModal(true)
          setDraggingBooking(null)
          setDragOverRoom(null)
          setDragOverDate(null)
          return
        }
      }
    } catch (error) {
      console.error('Error checking new price:', error)
    }

    await executeDrop(draggingBooking.id, roomId, newCheckInStr, newCheckOutStr)
  }

  const executeDrop = async (bookingId: string, roomId: string, checkIn: string, checkOut: string, newPrice?: number) => {
    try {
      const updateData: Record<string, unknown> = {
        roomId,
        checkIn,
        checkOut,
      }

      if (newPrice !== undefined) {
        updateData.totalAmount = newPrice.toString()
      }

      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        fetchTimelineData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to move booking')
      }
    } catch (error) {
      console.error('Error moving booking:', error)
    } finally {
      setDraggingBooking(null)
      setDragOverRoom(null)
      setDragOverDate(null)
      setPendingDrop(null)
      setShowDragWarningModal(false)
    }
  }

  const handleConfirmDrop = (updatePrice: boolean) => {
    if (!pendingDrop) return
    executeDrop(
      pendingDrop.booking.id,
      pendingDrop.roomId,
      pendingDrop.newCheckIn,
      pendingDrop.newCheckOut,
      updatePrice ? pendingDrop.newPrice ?? undefined : undefined
    )
  }

  const handleCancelDrop = () => {
    setPendingDrop(null)
    setShowDragWarningModal(false)
  }

  // Get timeline rows in hierarchical order
  const getTimelineRows = (): TimelineRow[] => {
    if (!timelineData?.buildings) return []
    const rows: TimelineRow[] = []
    timelineData.buildings.forEach((building) => {
      rows.push({ type: 'building', building })
      building.roomTypes?.forEach((roomType) => {
        rows.push({ type: 'roomType', roomType, buildingName: building.name })
        roomType.rooms?.forEach((room) => {
          rows.push({
            type: 'room',
            room,
            roomTypeName: getLocalizedText(roomType.name, language),
            roomTypeId: roomType.id,
            buildingName: building.name,
          })
        })
      })
    })
    return rows
  }

  const timelineRows = getTimelineRows()
  const roomRows = timelineRows.filter((row): row is TimelineRow & { type: 'room' } => row.type === 'room')

  const calculateTotalHeight = () => {
    return timelineRows.reduce((total, row) => {
      return total + (row.type === 'room' ? ROOM_HEIGHT : HEADER_ROW_HEIGHT)
    }, 0)
  }

  const calculateRowTop = (rowIndex: number): number => {
    let top = 0
    for (let i = 0; i < rowIndex; i++) {
      top += timelineRows[i].type === 'room' ? ROOM_HEIGHT : HEADER_ROW_HEIGHT
    }
    return top
  }

  const findRoomRowIndex = (roomId: string): number => {
    return timelineRows.findIndex(
      (row) => row.type === 'room' && row.room.id === roomId
    )
  }

  const isDayInactive = (roomTypeId: string, dateStr: string): boolean => {
    if (!timelineData) return false
    const inactiveDays = timelineData.inactiveDaysByRoomType[roomTypeId]
    return inactiveDays?.includes(dateStr) || false
  }

  if (loading && !timelineData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
        <p className="text-sm text-stone-500">Loading timeline...</p>
      </div>
    )
  }

  if (!loading && !timelineData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500">Failed to load timeline data. Please try again.</p>
        <button
          onClick={() => fetchTimelineData()}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDays(-7)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Previous week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateDays(-1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Previous day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => navigateDays(1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Next day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigateDays(7)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
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
            className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
          />

          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(parseInt(e.target.value))}
            className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
          >
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
            <option value={60}>2 months</option>
            <option value={90}>3 months</option>
          </select>

          {/* Legend */}
          <div className="flex items-center gap-4 ml-auto text-sm flex-wrap">
            {Object.entries(SOURCE_ICONS).map(([source, icon]) => (
              <div key={source} className="flex items-center gap-1">
                <img src={icon} alt={source} className="w-4 h-4 object-contain" />
                <span className="text-stone-600">{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
              <span className="text-stone-600">Inactive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex bg-white rounded-xl border border-stone-200 overflow-hidden h-[700px]">
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

          {/* Fixed left column */}
          <div
            data-room-sidebar
            className="absolute left-0 bg-white border-r border-stone-200 z-20 overflow-y-auto"
            style={{ top: HEADER_HEIGHT, bottom: 0, width: ROOM_COLUMN_WIDTH, scrollbarWidth: 'none' }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement
              const mainContent = document.getElementById('timeline-content')
              if (mainContent) {
                mainContent.scrollTop = target.scrollTop
              }
            }}
          >
            {timelineRows.map((row) => {
              if (row.type === 'building') {
                return (
                  <div
                    key={`building-${row.building.id}`}
                    className="border-b border-stone-200 px-3 flex items-center bg-stone-800"
                    style={{ height: HEADER_ROW_HEIGHT }}
                  >
                    <p className="text-sm font-semibold text-white truncate">
                      {row.building.name}
                    </p>
                  </div>
                )
              }

              if (row.type === 'roomType') {
                return (
                  <div
                    key={`roomType-${row.roomType.id}`}
                    className="border-b border-stone-200 px-3 pl-5 flex items-center bg-stone-100"
                    style={{ height: HEADER_ROW_HEIGHT }}
                  >
                    <p className="text-xs font-medium text-stone-600 truncate">
                      {getLocalizedText(row.roomType.name, language)}
                    </p>
                  </div>
                )
              }

              return (
                <div
                  key={`room-${row.room.id}`}
                  className={`border-b border-stone-100 px-3 pl-8 flex items-center ${
                    !row.room.isActive ? 'bg-stone-50' : ''
                  }`}
                  style={{ height: ROOM_HEIGHT }}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <p className={`text-sm truncate ${!row.room.isActive ? 'text-stone-400' : 'text-stone-900'}`}>
                      {row.room.name}
                    </p>
                    {!row.room.isActive && (
                      <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-stone-200 text-stone-500 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
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
                height: calculateTotalHeight(),
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

              {/* Row lines */}
              {timelineRows.map((row, index) => {
                const top = calculateRowTop(index)
                const height = row.type === 'room' ? ROOM_HEIGHT : HEADER_ROW_HEIGHT
                const isHeader = row.type !== 'room'
                return (
                  <div
                    key={`row-${index}`}
                    className={`absolute left-0 right-0 border-b ${isHeader ? 'border-stone-200 bg-stone-50/30' : 'border-stone-100'}`}
                    style={{ top, height }}
                  />
                )
              })}

              {/* Click areas for rooms */}
              {timelineRows.map((row, rowIndex) => {
                if (row.type !== 'room') return null
                const rowTop = calculateRowTop(rowIndex)

                return dates.map((date, dateIndex) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const isDropTarget = dragOverRoom === row.room.id && dragOverDate === dateStr
                  const isRoomInactive = !row.room.isActive
                  const isDateInactive = isDayInactive(row.roomTypeId, dateStr)
                  const isDisabled = isRoomInactive || isDateInactive

                  return (
                    <div
                      key={`click-${row.room.id}-${dateIndex}`}
                      className={`absolute transition-colors ${
                        isDateInactive
                          ? 'bg-red-100/80 cursor-not-allowed'
                          : isRoomInactive
                            ? 'bg-stone-100/80 cursor-not-allowed'
                            : isDropTarget
                              ? 'bg-amber-100 cursor-pointer'
                              : 'hover:bg-stone-100/50 cursor-pointer'
                      }`}
                      style={{
                        left: dateIndex * DAY_WIDTH,
                        top: rowTop,
                        width: DAY_WIDTH,
                        height: ROOM_HEIGHT,
                      }}
                      onClick={() => !draggingBooking && !isDisabled && openCreateBooking(row.room.id, dateStr)}
                      onDragOver={(e) => !isDisabled && handleDragOver(row.room.id, dateStr, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !isDisabled && handleDrop(row.room.id, dateStr, e)}
                      title={isDateInactive ? 'This day is marked as inactive' : isRoomInactive ? 'This room is inactive' : undefined}
                    />
                  )
                })
              })}

              {/* Bookings */}
              {roomRows.map((row) => {
                const roomBookings = timelineData?.bookingsByRoom[row.room.id] || []
                const rowIndex = findRoomRowIndex(row.room.id)
                const rowTop = calculateRowTop(rowIndex)

                return roomBookings.map((booking) => {
                  const { left, width } = getBookingPosition(booking)
                  const colors = SOURCE_COLORS[booking.source]
                  const statusClass = TIMELINE_STATUS_OPACITY[booking.status]

                  if (left + width < 0 || left > dates.length * DAY_WIDTH) return null

                  const isDragging = draggingBooking?.id === booking.id

                  return (
                    <div
                      key={booking.id}
                      draggable
                      className={`absolute rounded-lg border-2 ${colors.bg} ${colors.border} ${statusClass} cursor-grab transition-all hover:shadow-lg hover:z-10 ${
                        isDragging ? 'opacity-50 cursor-grabbing' : ''
                      }`}
                      style={{
                        left: Math.max(0, left),
                        top: rowTop + 4,
                        width: Math.min(width, dates.length * DAY_WIDTH - left),
                        height: ROOM_HEIGHT - 8,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!draggingBooking) openEditBooking(booking)
                      }}
                      onDragStart={(e) => handleDragStart(booking, e)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={(e) => handleBookingHover(booking, e)}
                      onMouseLeave={() => setHoveredBooking(null)}
                    >
                      <div className="h-full px-2 py-1 flex items-center gap-2 overflow-hidden">
                        <img src={SOURCE_ICONS[booking.source]} alt={booking.source} className="w-4 h-4 object-contain flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-medium truncate ${colors.text}`}>
                            {booking.guestName}
                          </p>
                          <p className={`text-xs truncate ${colors.text} opacity-70`}>
                            {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Payment status indicator */}
                          <span className={`w-2 h-2 rounded-full ${
                            booking.paymentStatus === 'FULLY_PAID' ? 'bg-green-500' :
                            booking.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-500' :
                            booking.paymentStatus === 'REFUNDED' ? 'bg-red-500' :
                            'bg-stone-300'
                          }`} title={PAYMENT_LABELS[booking.paymentStatus]} />
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
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-200 p-4 w-80 pointer-events-none"
          style={{
            left: Math.min(hoverPosition.x + 10, window.innerWidth - 340),
            top: Math.min(hoverPosition.y + 10, window.innerHeight - 350),
          }}
        >
          {/* Header with source and status badges */}
          <div className="flex items-center gap-2 mb-3">
            <img src={SOURCE_ICONS[hoveredBooking.source]} alt={hoveredBooking.source} className="w-4 h-4 object-contain" />
            <span className="text-xs font-medium text-stone-600">
              {SOURCE_LABELS[hoveredBooking.source]}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[hoveredBooking.status].bg} ${STATUS_COLORS[hoveredBooking.status].text}`}>
                {STATUS_LABELS[hoveredBooking.status]}
              </span>
            </div>
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

          {/* Payment Status and Total */}
          <div className="mt-3 pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Payment:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_COLORS[hoveredBooking.paymentStatus].bg} ${PAYMENT_COLORS[hoveredBooking.paymentStatus].text}`}>
                  {PAYMENT_LABELS[hoveredBooking.paymentStatus]}
                </span>
              </div>
              {hoveredBooking.totalAmount && (
                <span className="font-semibold text-stone-900">{hoveredBooking.totalAmount.toFixed(2)} EUR</span>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-amber-600">Click to view details & manage</p>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false)
          setEditingBooking(null)
          setSelectedRoomId(null)
          setSelectedDate(null)
        }}
        onSave={fetchTimelineData}
        editingBooking={editingBooking}
        availableRooms={availableRooms}
        initialRoomId={selectedRoomId || undefined}
        initialDate={selectedDate || undefined}
      />

      {/* Drag Warning Modal */}
      {showDragWarningModal && pendingDrop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900">Price Change Detected</h3>
            </div>

            <p className="text-stone-600 mb-4">
              Moving this booking to the new dates will change the calculated price.
            </p>

            <div className="bg-stone-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Guest:</span>
                <span className="font-medium text-stone-800">{pendingDrop.booking.guestName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">New dates:</span>
                <span className="font-medium text-stone-800">
                  {new Date(pendingDrop.newCheckIn).toLocaleDateString()} - {new Date(pendingDrop.newCheckOut).toLocaleDateString()}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Current price:</span>
                  <span className="font-medium text-stone-800">{pendingDrop.oldPrice?.toFixed(2)} EUR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">New price:</span>
                  <span className={`font-medium ${pendingDrop.newPrice! > pendingDrop.oldPrice! ? 'text-green-600' : 'text-red-600'}`}>
                    {pendingDrop.newPrice?.toFixed(2)} EUR
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleConfirmDrop(true)}
                className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Move & Update Price
              </button>
              <button
                onClick={() => handleConfirmDrop(false)}
                className="w-full px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Move & Keep Original Price
              </button>
              <button
                onClick={handleCancelDrop}
                className="w-full px-4 py-2 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
