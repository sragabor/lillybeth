'use client'

import {useState, useEffect, useCallback, Fragment} from 'react'
import {
  Booking,
  AvailableRoom,
  BookingStatus,
  SOURCE_COLORS,
  SOURCE_LABELS,
  SOURCE_ICONS,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ICONS,
  STATUS_ACTION_LABELS,
  getNextStatus,
  PAYMENT_COLORS,
  PAYMENT_LABELS,
} from '../types'
import BookingModal from './BookingModal'
import { LocalizedText } from '@/lib/i18n'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'

type Tab = 'all' | 'upcoming' | 'past'
type SortField = 'guestName' | 'checkIn' | 'guestCount' | 'totalAmount'
type SortOrder = 'asc' | 'desc'

interface BookingListViewProps {
  buildings: { id: string; name: string; roomTypes: { id: string; name: LocalizedText; rooms: { id: string; name: string; isActive: boolean }[] }[] }[]
  availableRooms: AvailableRoom[]
  // Filters from parent
  filterBuildingId?: string
  filterRoomTypeId?: string
  filterSource?: string
  // List-only filters
  filterStartDate?: string
  filterEndDate?: string
  filterRoomId?: string
  onFiltersChange?: (filters: { startDate: string; endDate: string; roomId: string }) => void
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface ExpandedBookingDetails {
  booking: Booking
  priceBreakdown: {
    nights: number
    nightlyBreakdown: {
      date: string
      dayOfWeek: string
      price: number
      isWeekend: boolean
      source: string
    }[]
    accommodationTotal: number
    mandatoryPrices: { id: string; title: string; priceEur: number; quantity: number; total: number }[]
    optionalPrices: { id: string; title: string; priceEur: number; quantity: number; total: number }[]
    mandatoryTotal: number
    optionalTotal: number
    additionalTotal: number
    grandTotal: number
  }
}

export default function BookingListView({
  buildings,
  availableRooms,
  filterBuildingId,
  filterRoomTypeId,
  filterSource,
  filterStartDate: externalStartDate,
  filterEndDate: externalEndDate,
  filterRoomId: externalRoomId,
  onFiltersChange,
}: BookingListViewProps) {
  const { language } = useLanguage()
  // State
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  // Sorting
  const [sortBy, setSortBy] = useState<SortField>('checkIn')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Expanded rows
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<ExpandedBookingDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

  // Inline status update state
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  // List-only filters (internal state)
  const [startDate, setStartDate] = useState(externalStartDate || '')
  const [endDate, setEndDate] = useState(externalEndDate || '')
  const [roomId, setRoomId] = useState(externalRoomId || '')
  const [guestNameSearch, setGuestNameSearch] = useState('')

  // Sync external filters
  useEffect(() => {
    setStartDate(externalStartDate || '')
    setEndDate(externalEndDate || '')
    setRoomId(externalRoomId || '')
  }, [externalStartDate, externalEndDate, externalRoomId])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (filterBuildingId) params.set('buildingId', filterBuildingId)
      if (filterRoomTypeId) params.set('roomTypeId', filterRoomTypeId)
      if (filterSource) params.set('source', filterSource)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (roomId) params.set('roomId', roomId)
      if (guestNameSearch) params.set('guestName', guestNameSearch)

      const res = await fetch(`/api/admin/bookings/list?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, pagination.page, pagination.limit, sortBy, sortOrder, filterBuildingId, filterRoomTypeId, filterSource, startDate, endDate, roomId, guestNameSearch])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Reset page when filters/tab change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [activeTab, filterBuildingId, filterRoomTypeId, filterSource, startDate, endDate, roomId, guestNameSearch])

  // Fetch expanded booking details
  const fetchBookingDetails = async (bookingId: string) => {
    setLoadingDetails(true)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/details`)
      if (res.ok) {
        const data = await res.json()
        setExpandedDetails(data)
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Toggle expanded row
  const toggleExpanded = (bookingId: string) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null)
      setExpandedDetails(null)
    } else {
      setExpandedBookingId(bookingId)
      fetchBookingDetails(bookingId)
    }
  }

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="text-stone-300 ml-1">↕</span>
    return <span className="text-amber-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  // Handle edit
  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking)
    setShowModal(true)
  }

  // Handle inline status update
  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingStatusId(bookingId)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchBookings()
        if (expandedBookingId === bookingId) {
          fetchBookingDetails(bookingId)
        }
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Handle filter changes
  const handleFilterChange = (field: 'startDate' | 'endDate' | 'roomId', value: string) => {
    const newFilters = { startDate, endDate, roomId }
    newFilters[field] = value

    if (field === 'startDate') setStartDate(value)
    if (field === 'endDate') setEndDate(value)
    if (field === 'roomId') setRoomId(value)

    onFiltersChange?.(newFilters)
  }

  // Get all rooms for room filter
  const allRooms = buildings.flatMap((b) =>
    b.roomTypes.flatMap((rt) =>
      rt.rooms.map((r) => ({
        ...r,
        roomTypeName: getLocalizedText(rt.name, language),
        buildingName: b.name,
      }))
    )
  )

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Generate 6-digit booking ID from cuid
  const getShortId = (id: string) => {
    // Use last 6 characters of the ID
    return id.slice(-6).toUpperCase()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-stone-200">
        {(['all', 'upcoming', 'past'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? 'text-amber-600 border-b-2 border-amber-600 -mb-px'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab === 'all' && 'All Bookings'}
            {tab === 'upcoming' && 'Upcoming'}
            {tab === 'past' && 'Past'}
          </button>
        ))}
      </div>

      {/* List-only Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Guest Name Search */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">Guest:</label>
          <div className="relative">
            <input
              type="text"
              value={guestNameSearch}
              onChange={(e) => setGuestNameSearch(e.target.value)}
              placeholder="Search by name..."
              className="px-3 py-1.5 pl-8 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent w-48"
            />
            <svg
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">Room:</label>
          <select
            value={roomId}
            onChange={(e) => handleFilterChange('roomId', e.target.value)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Rooms</option>
            {allRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.buildingName} / {room.roomTypeName} / {room.name}
              </option>
            ))}
          </select>
        </div>
        {(startDate || endDate || roomId || guestNameSearch) && (
          <button
            onClick={() => {
              setStartDate('')
              setEndDate('')
              setRoomId('')
              setGuestNameSearch('')
              onFiltersChange?.({ startDate: '', endDate: '', roomId: '' })
            }}
            className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-stone-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  ID
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100"
                  onClick={() => handleSort('guestName')}
                >
                  Guest <SortIndicator field="guestName" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Phone
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100"
                  onClick={() => handleSort('checkIn')}
                >
                  Dates <SortIndicator field="checkIn" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Nights
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100"
                  onClick={() => handleSort('guestCount')}
                >
                  Guests <SortIndicator field="guestCount" />
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100"
                  onClick={() => handleSort('totalAmount')}
                >
                  Amount <SortIndicator field="totalAmount" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Info
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider w-10">

                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-800" />
                      <span className="text-stone-500">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-stone-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const isExpanded = expandedBookingId === booking.id
                  const isCancelled = booking.status === 'CANCELLED'
                  const sourceColors = SOURCE_COLORS[booking.source]
                  const statusColors = STATUS_COLORS[booking.status]
                  const paymentColors = PAYMENT_COLORS[booking.paymentStatus]

                  return (
                    <Fragment key={booking.id}>
                      {/* Main Row */}
                      <tr
                        key={booking.id}
                        className={`hover:bg-stone-50 transition-colors ${
                          isCancelled ? 'bg-red-50/50' : ''
                        } ${isExpanded ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-stone-600">
                            #{getShortId(booking.id)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <img src={SOURCE_ICONS[booking.source]} alt={booking.source} className="w-4 h-4 object-contain" />
                              <span className={`font-medium text-stone-900 ${isCancelled ? 'line-through' : ''}`}>
                                {booking.guestName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded">
                                {booking.room.roomType?.building.name}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                {booking.room.roomType?.name && getLocalizedText(booking.room.roomType.name, language)}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {booking.room.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600">
                          {booking.guestPhone || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>
                              <span className="text-stone-900">{formatDate(booking.checkIn)}</span>
                              <span className="text-stone-400 mx-1">→</span>
                              <span className="text-stone-900">{formatDate(booking.checkOut)}</span>
                            </div>
                            {booking.arrivalTime && (
                              <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {booking.arrivalTime}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-stone-600">
                          {booking.nights || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-stone-600">
                          {booking.guestCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-stone-900">
                              {booking.totalAmount ? `${booking.totalAmount.toFixed(2)} €` : '-'}
                            </span>
                            {booking.hasCustomHufPrice && booking.customHufPrice && (
                              <span className="text-xs text-purple-700 font-medium mt-0.5">
                                {booking.customHufPrice.toLocaleString()} Ft
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                          >
                            <span>{STATUS_ICONS[booking.status]}</span>
                            {STATUS_LABELS[booking.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${paymentColors.bg} ${paymentColors.text}`}
                          >
                            {PAYMENT_LABELS[booking.paymentStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {booking.hasCustomHufPrice && booking.customHufPrice && (
                              <span
                                title="Custom HUF price agreed"
                                className="px-1.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded"
                              >
                                HUF
                              </span>
                            )}
                            {booking.notes && (
                              <span title="Has notes">
                                <svg
                                  className="w-4 h-4 text-stone-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                  />
                                </svg>
                              </span>
                            )}
                            {booking.additionalPrices.length > 0 && (
                              <span title="Has additional prices">
                                <svg
                                  className="w-4 h-4 text-amber-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleExpanded(booking.id)}
                            className={`p-1 rounded hover:bg-stone-200 transition-colors cursor-pointer ${
                              isExpanded ? 'bg-stone-200' : ''
                            }`}
                          >
                            <svg
                              className={`w-5 h-5 text-stone-600 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      <>
                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr key={`${booking.id}-expanded`}>
                          <td colSpan={11} className="px-4 py-4 bg-stone-50">
                            {loadingDetails ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-800" />
                              </div>
                            ) : expandedDetails ? (
                              <div className="grid grid-cols-3 gap-6">
                                {/* Guest Details */}
                                <div>
                                  <h4 className="font-medium text-stone-900 mb-2">Guest Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="text-stone-500">Name:</span>{' '}
                                      <span className="text-stone-900">{booking.guestName}</span>
                                    </p>
                                    <p>
                                      <span className="text-stone-500">Email:</span>{' '}
                                      <span className="text-stone-900">{booking.guestEmail || '-'}</span>
                                    </p>
                                    <p>
                                      <span className="text-stone-500">Phone:</span>{' '}
                                      <span className="text-stone-900">{booking.guestPhone || '-'}</span>
                                    </p>
                                    <p>
                                      <span className="text-stone-500">Guests:</span>{' '}
                                      <span className="text-stone-900">{booking.guestCount}</span>
                                    </p>
                                    <p>
                                      <span className="text-stone-500">Source:</span>{' '}
                                      <span className={`${sourceColors.text}`}>
                                        {SOURCE_LABELS[booking.source]}
                                      </span>
                                    </p>
                                    {booking.notes && (
                                      <div className="mt-2 p-2 bg-white rounded border border-stone-200">
                                        <p className="text-xs text-stone-500 mb-1">Notes:</p>
                                        <p className="text-stone-700">{booking.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Price Breakdown */}
                                <div>
                                  <h4 className="font-medium text-stone-900 mb-2">Price Breakdown</h4>
                                  <div className="space-y-2 text-sm">
                                    {/* Nightly breakdown (collapsed by default) */}
                                    <div className="flex justify-between">
                                      <span className="text-stone-600">
                                        Accommodation ({expandedDetails.priceBreakdown.nights} nights)
                                      </span>
                                      <span className="text-stone-900">
                                        {expandedDetails.priceBreakdown.accommodationTotal.toFixed(2)} €
                                      </span>
                                    </div>

                                    {/* Mandatory Prices */}
                                    {expandedDetails.priceBreakdown.mandatoryPrices.length > 0 && (
                                      <div className="border-t border-stone-200 pt-2">
                                        <p className="text-xs text-stone-500 mb-1">Mandatory</p>
                                        {expandedDetails.priceBreakdown.mandatoryPrices.map((p) => (
                                          <div key={p.id} className="flex justify-between">
                                            <span className="text-stone-600">
                                              {p.title} {p.quantity > 1 && `x${p.quantity}`}
                                            </span>
                                            <span className="text-stone-900">{p.total.toFixed(2)} €</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Optional Prices */}
                                    {expandedDetails.priceBreakdown.optionalPrices.length > 0 && (
                                      <div className="border-t border-stone-200 pt-2">
                                        <p className="text-xs text-stone-500 mb-1">Optional</p>
                                        {expandedDetails.priceBreakdown.optionalPrices.map((p) => (
                                          <div key={p.id} className="flex justify-between">
                                            <span className="text-stone-600">
                                              {p.title} {p.quantity > 1 && `x${p.quantity}`}
                                            </span>
                                            <span className="text-stone-900">{p.total.toFixed(2)} €</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Total */}
                                    <div className="border-t border-stone-300 pt-2">
                                      <div className="flex justify-between font-medium">
                                        <span className="text-stone-900">Total (EUR)</span>
                                        <span className="text-stone-900">
                                          {expandedDetails.priceBreakdown.grandTotal.toFixed(2)} €
                                        </span>
                                      </div>
                                      {booking.hasCustomHufPrice && booking.customHufPrice && (
                                        <div className="flex justify-between font-medium mt-1 pt-1 border-t border-purple-200">
                                          <span className="text-purple-700">Custom HUF Price</span>
                                          <span className="text-purple-700">
                                            {booking.customHufPrice.toLocaleString()} Ft
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status & Payment Controls */}
                                <div className="flex flex-col gap-4">
                                  {/* Status Control */}
                                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                                    <h4 className="font-medium text-stone-900 mb-2 text-sm">Status</h4>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                        {STATUS_LABELS[booking.status]}
                                      </span>
                                    </div>
                                    {!isCancelled && getNextStatus(booking.status) && (
                                      <button
                                        onClick={() => handleStatusUpdate(booking.id, getNextStatus(booking.status)!)}
                                        disabled={updatingStatusId === booking.id}
                                        className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        {updatingStatusId === booking.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                            Updating...
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                            </svg>
                                            {STATUS_ACTION_LABELS[booking.status]}
                                          </>
                                        )}
                                      </button>
                                    )}
                                    {booking.status === 'CHECKED_OUT' && (
                                      <p className="text-xs text-emerald-600 text-center">Booking completed</p>
                                    )}
                                  </div>

                                  {/* Payment Info */}
                                  <div className="bg-white rounded-lg border border-stone-200 p-3">
                                    <h4 className="font-medium text-stone-900 mb-2 text-sm">Payment</h4>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColors.bg} ${paymentColors.text}`}>
                                        {PAYMENT_LABELS[booking.paymentStatus]}
                                      </span>
                                      <div className="text-right">
                                        <span className="text-sm font-medium text-stone-900">
                                          {booking.totalAmount?.toFixed(2) || '0.00'} €
                                        </span>
                                        {booking.hasCustomHufPrice && booking.customHufPrice && (
                                          <div className="text-xs font-medium text-purple-700">
                                            {booking.customHufPrice.toLocaleString()} Ft
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {booking.hasCustomHufPrice && booking.customHufPrice && (
                                      <div className="mt-2 px-2 py-1.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                                        <span className="font-medium">Custom HUF price</span> – manually agreed amount
                                      </div>
                                    )}
                                    <p className="text-xs text-stone-500 mt-1">
                                      Click Edit to manage payments
                                    </p>
                                  </div>

                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleEdit(booking)}
                                    className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer text-sm"
                                  >
                                    {isCancelled ? 'View Details' : 'Edit Booking'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-center text-stone-500">Failed to load details</p>
                            )}
                          </td>
                        </tr>
                      )}
                      </>
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-stone-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm text-stone-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.hasMore}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingBooking(null)
        }}
        onSave={() => {
          fetchBookings()
          if (expandedBookingId) {
            fetchBookingDetails(expandedBookingId)
          }
        }}
        editingBooking={editingBooking}
        availableRooms={availableRooms}
      />
    </div>
  )
}
