'use client'

import { useState, useEffect } from 'react'
import {
  BookingSource,
  SOURCE_LABELS,
  SOURCE_ICONS,
} from '../types'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { LocalizedText } from '@/lib/i18n'

interface AvailableRoom {
  id: string
  name: string
  roomType: {
    id: string
    name: LocalizedText
    capacity: number
    building: { id: string; name: string }
  }
}

interface SelectedRoom {
  roomId: string
  guestCount: number
}

interface CreateBookingGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  initialDate?: string
}

export default function CreateBookingGroupModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
}: CreateBookingGroupModalProps) {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Form state
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [source, setSource] = useState<BookingSource>('MANUAL')
  const [checkIn, setCheckIn] = useState(initialDate || '')
  const [checkOut, setCheckOut] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [notes, setNotes] = useState('')

  // Selected rooms
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([])

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Price calculation state
  interface RoomPriceInfo {
    roomId: string
    roomTotal: number
    accommodationTotal: number
    mandatoryTotal: number
  }
  const [priceBreakdowns, setPriceBreakdowns] = useState<RoomPriceInfo[]>([])
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null)
  const [calculatingPrice, setCalculatingPrice] = useState(false)

  // Fetch all rooms
  useEffect(() => {
    if (isOpen) {
      fetchRooms()
    }
  }, [isOpen])

  // Set initial date when it changes
  useEffect(() => {
    if (initialDate) {
      setCheckIn(initialDate)
    }
  }, [initialDate])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings/timeline?startDate=2000-01-01&endDate=2000-01-02')
      if (res.ok) {
        const data = await res.json()
        const rooms: AvailableRoom[] = []
        data.buildings?.forEach((building: { id: string; name: string; roomTypes: { id: string; name: LocalizedText; capacity: number; rooms: { id: string; name: string; isActive: boolean }[] }[] }) => {
          building.roomTypes?.forEach((roomType) => {
            roomType.rooms?.forEach((room) => {
              if (room.isActive) {
                rooms.push({
                  id: room.id,
                  name: room.name,
                  roomType: {
                    id: roomType.id,
                    name: roomType.name,
                    capacity: roomType.capacity,
                    building: { id: building.id, name: building.name },
                  },
                })
              }
            })
          })
        })
        setAvailableRooms(rooms)
      }
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check availability when dates change
  useEffect(() => {
    if (checkIn && checkOut && selectedRooms.length > 0) {
      checkAvailability()
    }
  }, [checkIn, checkOut])

  // Calculate prices when rooms or dates change
  useEffect(() => {
    if (checkIn && checkOut && selectedRooms.length >= 2) {
      calculateGroupPrice()
    } else {
      setPriceBreakdowns([])
      setCalculatedTotal(null)
    }
  }, [checkIn, checkOut, JSON.stringify(selectedRooms)])

  const calculateGroupPrice = async () => {
    if (!checkIn || !checkOut || selectedRooms.length < 2) return

    setCalculatingPrice(true)
    try {
      const res = await fetch('/api/admin/booking-groups/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          checkOut,
          rooms: selectedRooms.map((r) => ({
            roomId: r.roomId,
            guestCount: r.guestCount,
          })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPriceBreakdowns(data.rooms)
        setCalculatedTotal(data.groupTotal)
      }
    } catch (err) {
      console.error('Error calculating price:', err)
    } finally {
      setCalculatingPrice(false)
    }
  }

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return

    setCheckingAvailability(true)
    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        roomIds: selectedRooms.map(r => r.roomId).join(','),
      })
      const res = await fetch(`/api/admin/bookings/check-availability?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.conflicts && data.conflicts.length > 0) {
          // Remove conflicting rooms from selection
          const conflictingIds = new Set(data.conflicts.map((c: { roomId: string }) => c.roomId))
          setSelectedRooms(prev => prev.filter(r => !conflictingIds.has(r.roomId)))
          setError(`Some rooms are not available for the selected dates and have been deselected.`)
        } else {
          setError(null)
        }
      }
    } catch (err) {
      console.error('Error checking availability:', err)
    } finally {
      setCheckingAvailability(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      setSource('MANUAL')
      setCheckIn(initialDate || '')
      setCheckOut('')
      setArrivalTime('')
      setNotes('')
      setSelectedRooms([])
      setError(null)
      // Reset price state
      setPriceBreakdowns([])
      setCalculatedTotal(null)
    }
  }, [isOpen, initialDate])

  // Toggle room selection
  const toggleRoom = (roomId: string, capacity: number) => {
    setSelectedRooms(prev => {
      const existing = prev.find(r => r.roomId === roomId)
      if (existing) {
        return prev.filter(r => r.roomId !== roomId)
      } else {
        return [...prev, { roomId, guestCount: Math.min(2, capacity) }]
      }
    })
    setError(null)
  }

  // Update guest count for a room
  const updateGuestCount = (roomId: string, count: number) => {
    setSelectedRooms(prev =>
      prev.map(r => r.roomId === roomId ? { ...r, guestCount: count } : r)
    )
  }

  // Handle create
  const handleCreate = async () => {
    if (!guestName || !checkIn || !checkOut) {
      setError('Please fill in guest name and dates')
      return
    }

    if (selectedRooms.length < 2) {
      setError('Please select at least 2 rooms for a group booking')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Build room data with calculated prices
      const roomsWithPrices = selectedRooms.map(r => {
        const priceInfo = priceBreakdowns.find(p => p.roomId === r.roomId)
        return {
          roomId: r.roomId,
          guestCount: r.guestCount,
          totalAmount: priceInfo?.roomTotal || null,
        }
      })

      const res = await fetch('/api/admin/booking-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestEmail: guestEmail || null,
          guestPhone: guestPhone || null,
          source,
          checkIn,
          checkOut,
          arrivalTime: arrivalTime || null,
          notes: notes || null,
          totalAmount: calculatedTotal,
          rooms: roomsWithPrices,
        }),
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create group booking')
      }
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Failed to create group booking')
    } finally {
      setSaving(false)
    }
  }

  // Group rooms by building
  const roomsByBuilding = availableRooms.reduce((acc, room) => {
    const buildingName = room.roomType.building.name
    if (!acc[buildingName]) {
      acc[buildingName] = []
    }
    acc[buildingName].push(room)
    return acc
  }, {} as Record<string, AvailableRoom[]>)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">New Group Booking</h2>
              <p className="text-sm text-stone-600">
                Book multiple rooms for one guest
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Guest & Booking Info */}
              <div className="space-y-6">
                {/* Error Banner */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                {/* Guest Information */}
                <div>
                  <h3 className="text-sm font-medium text-stone-700 mb-3">Guest Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Guest Name *</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter guest name"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="Email address"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="Phone number"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Dates */}
                <div>
                  <h3 className="text-sm font-medium text-stone-700 mb-3">Booking Dates</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Check-in *</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Check-out *</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-stone-500 mb-1">Arrival Time</label>
                    <input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    />
                  </div>
                </div>

                {/* Source & Notes */}
                <div>
                  <h3 className="text-sm font-medium text-stone-700 mb-3">Booking Source</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(Object.keys(SOURCE_LABELS) as BookingSource[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSource(s)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          source === s
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <img src={SOURCE_ICONS[s]} alt={s} className="w-4 h-4 object-contain" />
                        <span className="text-sm">{SOURCE_LABELS[s]}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special requests or notes..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Room Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-stone-700">
                    Select Rooms <span className="text-stone-500">(min. 2 for group)</span>
                  </h3>
                  {checkingAvailability && (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-500" />
                      Checking...
                    </div>
                  )}
                </div>

                {/* Selected Rooms Summary */}
                {selectedRooms.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-700">
                        {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-indigo-600">
                          {selectedRooms.reduce((sum, r) => sum + r.guestCount, 0)} guests
                        </span>
                        {calculatingPrice && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedRooms.map((sr) => {
                        const room = availableRooms.find(r => r.id === sr.roomId)
                        const priceInfo = priceBreakdowns.find(p => p.roomId === sr.roomId)
                        if (!room) return null
                        return (
                          <div key={sr.roomId} className="flex items-center justify-between bg-white rounded p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded">
                                {room.roomType.building.name}
                              </span>
                              <span className="text-sm font-medium text-stone-900">{room.name}</span>
                              {priceInfo && (
                                <span className="text-xs text-green-600 font-medium">
                                  {priceInfo.roomTotal.toFixed(2)} €
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-stone-500">Guests:</label>
                              <select
                                value={sr.guestCount}
                                onChange={(e) => updateGuestCount(sr.roomId, parseInt(e.target.value))}
                                className="px-2 py-1 border border-stone-300 rounded text-sm cursor-pointer"
                              >
                                {Array.from({ length: room.roomType.capacity }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => toggleRoom(sr.roomId, room.roomType.capacity)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Calculated Total */}
                    {calculatedTotal !== null && (
                      <div className="mt-3 pt-3 border-t border-indigo-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-700">Calculated Total:</span>
                        <span className="text-lg font-bold text-indigo-700">{calculatedTotal.toFixed(2)} €</span>
                      </div>
                    )}
                    {selectedRooms.length >= 2 && checkIn && checkOut && (
                      <p className="text-xs text-indigo-600 mt-2">
                        Price includes accommodation + mandatory fees
                      </p>
                    )}
                  </div>
                )}

                {/* Available Rooms List */}
                <div className="border border-stone-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  {Object.entries(roomsByBuilding).map(([buildingName, rooms]) => (
                    <div key={buildingName}>
                      <div className="bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700 sticky top-0">
                        {buildingName}
                      </div>
                      <div className="divide-y divide-stone-100">
                        {rooms.map((room) => {
                          const isSelected = selectedRooms.some(r => r.roomId === room.id)
                          return (
                            <div
                              key={room.id}
                              onClick={() => toggleRoom(room.id, room.roomType.capacity)}
                              className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected ? 'bg-indigo-50' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                  {getLocalizedText(room.roomType.name, language)}
                                </span>
                                <span className="font-medium text-stone-900">{room.name}</span>
                              </div>
                              <span className="text-xs text-stone-500">
                                up to {room.roomType.capacity} guests
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !guestName || !checkIn || !checkOut || selectedRooms.length < 2}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Group Booking
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
