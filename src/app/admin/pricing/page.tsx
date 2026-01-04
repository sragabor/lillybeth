'use client'

import { useState, useEffect, useCallback } from 'react'

interface RoomType {
  id: string
  name: string
  capacity: number
  building: {
    id: string
    name: string
  }
}

interface DateRangePrice {
  id: string
  startDate: string
  endDate: string
  weekdayPrice: number
  weekendPrice: number
  minNights: number
  isInactive: boolean
  roomTypeId: string
}

interface DayPricing {
  date: string
  price: number | null
  minNights: number | null
  isInactive: boolean
  source: 'override' | 'range' | 'none'
  isWeekend: boolean
}

interface CalendarOverride {
  id: string
  date: string
  price: number | null
  minNights: number | null
  isInactive: boolean
  roomTypeId: string
}

interface PricingData {
  year: number
  month: number
  roomTypeId: string
  days: DayPricing[]
  dateRangePrices: DateRangePrice[]
  calendarOverrides: CalendarOverride[]
}

export default function PricingPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('')
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [pricingData, setPricingData] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(false)

  // Selection state for bulk editing
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)

  // Modal states
  const [showDateRangeModal, setShowDateRangeModal] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingDateRange, setEditingDateRange] = useState<DateRangePrice | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayPricing | null>(null)

  // Form states
  const [dateRangeForm, setDateRangeForm] = useState({
    startDate: '',
    endDate: '',
    weekdayPrice: '',
    weekendPrice: '',
    minNights: '1',
    isInactive: false,
  })

  const [dayForm, setDayForm] = useState({
    price: '',
    minNights: '',
    isInactive: false,
  })

  const [bulkForm, setBulkForm] = useState({
    price: '',
    minNights: '',
    isInactive: false,
  })

  // Error state for modals
  const [dateRangeError, setDateRangeError] = useState<string | null>(null)

  // Fetch room types on mount
  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const fetchPricingData = useCallback(async () => {
    if (!selectedRoomTypeId) return

    setCalendarLoading(true)
    try {
      const res = await fetch(
        `/api/admin/room-types/${selectedRoomTypeId}/pricing-calendar?year=${currentYear}&month=${currentMonth}`
      )
      const data = await res.json()
      setPricingData(data)
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setCalendarLoading(false)
    }
  }, [selectedRoomTypeId, currentYear, currentMonth])

  // Fetch pricing data when room type or month changes
  useEffect(() => {
    if (selectedRoomTypeId) {
      fetchPricingData()
      setSelectedDates(new Set()) // Clear selection on month change
    }
  }, [selectedRoomTypeId, fetchPricingData])

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch('/api/admin/room-types')
      const data = await res.json()
      setRoomTypes(data.roomTypes || [])
      // Select first room type by default
      if (data.roomTypes?.length > 0) {
        setSelectedRoomTypeId(data.roomTypes[0].id)
      }
    } catch (error) {
      console.error('Error fetching room types:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction
    let newYear = currentYear

    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  const goToToday = () => {
    setCurrentYear(new Date().getFullYear())
    setCurrentMonth(new Date().getMonth() + 1)
  }

  // Date range CRUD
  const handleCreateDateRange = async () => {
    setDateRangeError(null)
    try {
      const res = await fetch(`/api/admin/room-types/${selectedRoomTypeId}/date-range-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRangeForm),
      })

      if (res.ok) {
        setShowDateRangeModal(false)
        setDateRangeForm({ startDate: '', endDate: '', weekdayPrice: '', weekendPrice: '', minNights: '1', isInactive: false })
        fetchPricingData()
      } else {
        const data = await res.json()
        if (res.status === 409) {
          // Overlap error
          setDateRangeError(data.message || 'Date range overlaps with an existing range')
        } else {
          setDateRangeError(data.error || 'Failed to create date range')
        }
      }
    } catch (error) {
      console.error('Error creating date range price:', error)
      setDateRangeError('Failed to create date range')
    }
  }

  const handleUpdateDateRange = async () => {
    if (!editingDateRange) return
    setDateRangeError(null)

    try {
      const res = await fetch(`/api/admin/date-range-prices/${editingDateRange.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRangeForm),
      })

      if (res.ok) {
        setShowDateRangeModal(false)
        setEditingDateRange(null)
        setDateRangeForm({ startDate: '', endDate: '', weekdayPrice: '', weekendPrice: '', minNights: '1', isInactive: false })
        fetchPricingData()
      } else {
        const data = await res.json()
        if (res.status === 409) {
          // Overlap error
          setDateRangeError(data.message || 'Date range overlaps with an existing range')
        } else {
          setDateRangeError(data.error || 'Failed to update date range')
        }
      }
    } catch (error) {
      console.error('Error updating date range price:', error)
      setDateRangeError('Failed to update date range')
    }
  }

  const handleDeleteDateRange = async (id: string) => {
    if (!confirm('Are you sure you want to delete this date range price?')) return

    try {
      const res = await fetch(`/api/admin/date-range-prices/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchPricingData()
      }
    } catch (error) {
      console.error('Error deleting date range price:', error)
    }
  }

  const openEditDateRange = (dateRange: DateRangePrice) => {
    setEditingDateRange(dateRange)
    setDateRangeError(null)
    setDateRangeForm({
      startDate: dateRange.startDate.split('T')[0],
      endDate: dateRange.endDate.split('T')[0],
      weekdayPrice: dateRange.weekdayPrice.toString(),
      weekendPrice: dateRange.weekendPrice.toString(),
      minNights: dateRange.minNights.toString(),
      isInactive: dateRange.isInactive || false,
    })
    setShowDateRangeModal(true)
  }

  // Day override
  const handleDayClick = (day: DayPricing) => {
    if (isSelecting) {
      // Toggle selection
      const newSelection = new Set(selectedDates)
      if (newSelection.has(day.date)) {
        newSelection.delete(day.date)
      } else {
        newSelection.add(day.date)
      }
      setSelectedDates(newSelection)
    } else {
      // Open single day modal
      setSelectedDay(day)
      setDayForm({
        price: day.price?.toString() || '',
        minNights: day.minNights?.toString() || '',
        isInactive: day.isInactive,
      })
      setShowDayModal(true)
    }
  }

  const handleSaveDayOverride = async () => {
    if (!selectedDay) return

    try {
      const res = await fetch(`/api/admin/room-types/${selectedRoomTypeId}/calendar-overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDay.date,
          price: dayForm.price ? parseFloat(dayForm.price) : null,
          minNights: dayForm.minNights ? parseInt(dayForm.minNights) : null,
          isInactive: dayForm.isInactive,
        }),
      })

      if (res.ok) {
        setShowDayModal(false)
        setSelectedDay(null)
        fetchPricingData()
      }
    } catch (error) {
      console.error('Error saving day override:', error)
    }
  }

  const handleClearDayOverride = async () => {
    if (!selectedDay) return

    try {
      const res = await fetch(`/api/admin/room-types/${selectedRoomTypeId}/calendar-overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDay.date }),
      })

      if (res.ok) {
        setShowDayModal(false)
        setSelectedDay(null)
        fetchPricingData()
      }
    } catch (error) {
      console.error('Error clearing day override:', error)
    }
  }

  // Bulk operations
  const handleBulkSave = async () => {
    if (selectedDates.size === 0) return

    try {
      const res = await fetch(`/api/admin/room-types/${selectedRoomTypeId}/calendar-overrides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: Array.from(selectedDates),
          price: bulkForm.price ? parseFloat(bulkForm.price) : undefined,
          minNights: bulkForm.minNights ? parseInt(bulkForm.minNights) : undefined,
          isInactive: bulkForm.isInactive,
        }),
      })

      if (res.ok) {
        setShowBulkModal(false)
        setSelectedDates(new Set())
        setIsSelecting(false)
        setBulkForm({ price: '', minNights: '', isInactive: false })
        fetchPricingData()
      }
    } catch (error) {
      console.error('Error bulk updating:', error)
    }
  }

  const handleBulkClear = async () => {
    if (selectedDates.size === 0) return

    try {
      const res = await fetch(`/api/admin/room-types/${selectedRoomTypeId}/calendar-overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: Array.from(selectedDates) }),
      })

      if (res.ok) {
        setShowBulkModal(false)
        setSelectedDates(new Set())
        setIsSelecting(false)
        fetchPricingData()
      }
    } catch (error) {
      console.error('Error bulk clearing:', error)
    }
  }

  // Generate calendar grid
  const generateCalendarDays = () => {
    if (!pricingData) return []

    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const startDay = firstDayOfMonth.getDay() // 0 = Sunday

    // Create empty slots for days before the first of the month
    const emptyDays = Array(startDay).fill(null)

    return [...emptyDays, ...pricingData.days]
  }

  const formatMonthYear = () => {
    const date = new Date(currentYear, currentMonth - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getDayClasses = (day: DayPricing | null) => {
    if (!day) return 'bg-transparent'

    const isSelected = selectedDates.has(day.date)
    const isToday = day.date === new Date().toISOString().split('T')[0]

    let baseClasses = 'relative p-2 min-h-[80px] border border-stone-200 rounded-lg cursor-pointer transition-all '

    if (day.isInactive) {
      baseClasses += 'bg-red-50 hover:bg-red-100 '
    } else if (day.price === null) {
      baseClasses += 'bg-stone-100 hover:bg-stone-200 '
    } else if (day.source === 'override') {
      baseClasses += 'bg-amber-50 hover:bg-amber-100 '
    } else {
      baseClasses += 'bg-white hover:bg-stone-50 '
    }

    if (isSelected) {
      baseClasses += 'ring-2 ring-amber-500 '
    }

    if (isToday) {
      baseClasses += 'ring-2 ring-stone-400 '
    }

    return baseClasses
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
        <p className="text-sm text-stone-500">Loading pricing data...</p>
      </div>
    )
  }

  if (roomTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600">No room types found. Please create a building with room types first.</p>
      </div>
    )
  }

  // Group room types by building
  const groupedRoomTypes = roomTypes.reduce((acc, rt) => {
    const buildingName = rt.building.name
    if (!acc[buildingName]) {
      acc[buildingName] = []
    }
    acc[buildingName].push(rt)
    return acc
  }, {} as Record<string, RoomType[]>)

  const calendarDays = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Pricing Management</h1>
          <p className="text-stone-600 mt-1">Manage prices and availability per room type</p>
        </div>
      </div>

      {/* Room Type Selector */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <label className="block text-sm font-medium text-stone-700 mb-2">Select Room Type</label>
        <select
          value={selectedRoomTypeId}
          onChange={(e) => setSelectedRoomTypeId(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
        >
          {Object.entries(groupedRoomTypes).map(([buildingName, types]) => (
            <optgroup key={buildingName} label={buildingName}>
              {types.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} (Capacity: {rt.capacity})
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Current Selection Context */}
        {selectedRoomTypeId && (() => {
          const selectedRoomType = roomTypes.find(rt => rt.id === selectedRoomTypeId)
          return selectedRoomType ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-stone-500">Editing prices for:</span>
              <span className="font-medium text-stone-800">
                {selectedRoomType.building.name} → {selectedRoomType.name}
              </span>
            </div>
          ) : null
        })()}
      </div>

      {/* Date Range Prices Section */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">Date Range Prices</h2>
          <button
            onClick={() => {
              setEditingDateRange(null)
              setDateRangeError(null)
              setDateRangeForm({ startDate: '', endDate: '', weekdayPrice: '', weekendPrice: '', minNights: '1', isInactive: false })
              setShowDateRangeModal(true)
            }}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-sm cursor-pointer"
          >
            Add Date Range
          </button>
        </div>

        {pricingData?.dateRangePrices && pricingData.dateRangePrices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-stone-600 border-b border-stone-200">
                  <th className="pb-3 font-medium">Date Range</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Weekday Price</th>
                  <th className="pb-3 font-medium">Weekend Price</th>
                  <th className="pb-3 font-medium">Min Nights</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pricingData.dateRangePrices.map((range) => (
                  <tr key={range.id} className={`border-b border-stone-100 last:border-0 ${range.isInactive ? 'bg-red-50' : ''}`}>
                    <td className="py-3">
                      {new Date(range.startDate).toLocaleDateString()} - {new Date(range.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {range.isInactive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className={`py-3 ${range.isInactive ? 'text-stone-400' : ''}`}>
                      {range.isInactive ? '—' : `${range.weekdayPrice} EUR`}
                    </td>
                    <td className={`py-3 ${range.isInactive ? 'text-stone-400' : ''}`}>
                      {range.isInactive ? '—' : `${range.weekendPrice} EUR`}
                    </td>
                    <td className={`py-3 ${range.isInactive ? 'text-stone-400' : ''}`}>
                      {range.isInactive ? '—' : range.minNights}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditDateRange(range)}
                        className="text-amber-600 hover:text-amber-700 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDateRange(range.id)}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-stone-500 text-sm">No date range prices defined.</p>
        )}
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-stone-900">Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-medium text-stone-900 min-w-[160px] text-center">{formatMonthYear()}</span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selection toggle */}
            <button
              onClick={() => {
                setIsSelecting(!isSelecting)
                if (isSelecting) setSelectedDates(new Set())
              }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                isSelecting
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {isSelecting ? 'Cancel Selection' : 'Select Multiple'}
            </button>

            {selectedDates.size > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm cursor-pointer"
              >
                Edit {selectedDates.size} days
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-100 border border-stone-200 rounded" />
            <span className="text-stone-600">No price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-stone-200 rounded" />
            <span className="text-stone-600">Range price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded" />
            <span className="text-stone-600">Override</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded" />
            <span className="text-stone-600">Inactive</span>
          </div>
        </div>

        {/* Calendar Grid */}
        {calendarLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
            <p className="text-sm text-stone-500">Loading calendar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-stone-600 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-[80px]" />
              }

              const dayNum = new Date(day.date).getDate()

              return (
                <div
                  key={day.date}
                  onClick={() => handleDayClick(day)}
                  className={getDayClasses(day)}
                >
                  <span className={`text-sm font-medium ${day.isInactive ? 'text-red-600' : 'text-stone-900'}`}>
                    {dayNum}
                  </span>

                  {!day.isInactive && day.price !== null && (
                    <div className="mt-1">
                      <span className="text-xs font-semibold text-stone-700">{day.price} EUR</span>
                    </div>
                  )}

                  {day.minNights !== null && day.minNights > 1 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-xs text-stone-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      {day.minNights}
                    </div>
                  )}

                  {day.isInactive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-red-600 font-medium">Inactive</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Date Range Modal */}
      {showDateRangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              {editingDateRange ? 'Edit Date Range Price' : 'Add Date Range Price'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRangeForm.startDate}
                    onChange={(e) => setDateRangeForm({ ...dateRangeForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRangeForm.endDate}
                    onChange={(e) => setDateRangeForm({ ...dateRangeForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 ${dateRangeForm.isInactive ? 'opacity-50' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Weekday Price (EUR)</label>
                  <input
                    type="number"
                    value={dateRangeForm.weekdayPrice}
                    onChange={(e) => setDateRangeForm({ ...dateRangeForm, weekdayPrice: e.target.value })}
                    placeholder="Sun-Thu"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={dateRangeForm.isInactive}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Weekend Price (EUR)</label>
                  <input
                    type="number"
                    value={dateRangeForm.weekendPrice}
                    onChange={(e) => setDateRangeForm({ ...dateRangeForm, weekendPrice: e.target.value })}
                    placeholder="Fri-Sat"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={dateRangeForm.isInactive}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Minimum Nights</label>
                <input
                  type="number"
                  min="1"
                  value={dateRangeForm.minNights}
                  onChange={(e) => setDateRangeForm({ ...dateRangeForm, minNights: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={dateRangeForm.isInactive}
                />
              </div>

              {/* Inactive Toggle */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                <input
                  type="checkbox"
                  id="dateRangeInactive"
                  checked={dateRangeForm.isInactive}
                  onChange={(e) => setDateRangeForm({ ...dateRangeForm, isInactive: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="dateRangeInactive" className="text-sm text-stone-700 cursor-pointer">
                  <span className="font-medium">Mark entire date range as inactive</span>
                  <p className="text-xs text-stone-500">All days in this range will be unbookable</p>
                </label>
              </div>

              {/* Error Message */}
              {dateRangeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {dateRangeError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDateRangeModal(false)
                  setEditingDateRange(null)
                  setDateRangeError(null)
                }}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={editingDateRange ? handleUpdateDateRange : handleCreateDateRange}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                {editingDateRange ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Day Modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              Edit {new Date(selectedDay.date).toLocaleDateString()}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Price Override (EUR)
                </label>
                <input
                  type="number"
                  value={dayForm.price}
                  onChange={(e) => setDayForm({ ...dayForm, price: e.target.value })}
                  placeholder="Leave empty to use range price"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Min Nights Override
                </label>
                <input
                  type="number"
                  min="0"
                  value={dayForm.minNights}
                  onChange={(e) => setDayForm({ ...dayForm, minNights: e.target.value })}
                  placeholder="Leave empty to use range value"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isInactive"
                  checked={dayForm.isInactive}
                  onChange={(e) => setDayForm({ ...dayForm, isInactive: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isInactive" className="text-sm text-stone-700">
                  Mark as inactive (not bookable)
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={handleClearDayOverride}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear Override
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDayModal(false)
                    setSelectedDay(null)
                  }}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDayOverride}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              Edit {selectedDates.size} Selected Days
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Price Override (EUR)
                </label>
                <input
                  type="number"
                  value={bulkForm.price}
                  onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                  placeholder="Leave empty to keep existing"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Min Nights Override
                </label>
                <input
                  type="number"
                  min="0"
                  value={bulkForm.minNights}
                  onChange={(e) => setBulkForm({ ...bulkForm, minNights: e.target.value })}
                  placeholder="Leave empty to keep existing"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bulkIsInactive"
                  checked={bulkForm.isInactive}
                  onChange={(e) => setBulkForm({ ...bulkForm, isInactive: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="bulkIsInactive" className="text-sm text-stone-700">
                  Mark all as inactive (not bookable)
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={handleBulkClear}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear All Overrides
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSave}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Apply to All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
