'use client'

import { useState, useEffect } from 'react'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface AdditionalPrice {
  id: string
  title: string
  priceEur: number
  quantity: number
}

interface AvailableAdditionalPrice {
  id: string
  title: string
  priceEur: number
  mandatory: boolean
  perNight: boolean
  perGuest: boolean
  origin: 'building' | 'roomType'
}

interface RoomBooking {
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
      capacity?: number
      building: { id: string; name: string }
    } | null
  }
  additionalPrices: AdditionalPrice[]
}

interface RoomInGroupEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  groupId: string | null
  bookingId: string | null
}

export default function RoomInGroupEditModal({
  isOpen,
  onClose,
  onSave,
  groupId,
  bookingId,
}: RoomInGroupEditModalProps) {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roomBooking, setRoomBooking] = useState<RoomBooking | null>(null)
  const [availablePrices, setAvailablePrices] = useState<AvailableAdditionalPrice[]>([])

  // Form state
  const [guestCount, setGuestCount] = useState(1)
  const [selectedPrices, setSelectedPrices] = useState<{ id: string; quantity: number }[]>([])

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Fetch room booking data and available prices
  useEffect(() => {
    if (isOpen && groupId && bookingId) {
      fetchData()
    }
  }, [isOpen, groupId, bookingId])

  const fetchData = async () => {
    if (!groupId || !bookingId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch group data to get room booking
      const groupRes = await fetch(`/api/admin/booking-groups/${groupId}`)
      if (!groupRes.ok) {
        setError('Failed to fetch group data')
        setLoading(false)
        return
      }

      const groupData = await groupRes.json()
      const booking = groupData.group.bookings.find((b: RoomBooking) => b.id === bookingId)

      if (!booking) {
        setError('Room booking not found')
        setLoading(false)
        return
      }

      setRoomBooking(booking)
      setGuestCount(booking.guestCount)

      // Map existing additional prices to selected state
      const existingPrices = booking.additionalPrices.map((p: AdditionalPrice) => ({
        id: p.id,
        quantity: p.quantity,
      }))
      setSelectedPrices(existingPrices)

      // Fetch available additional prices for this room's building and room type
      if (booking.room.roomType) {
        const pricesRes = await fetch(
          `/api/admin/additional-prices?roomTypeId=${booking.room.roomType.id}&buildingId=${booking.room.roomType.building.id}`
        )
        if (pricesRes.ok) {
          const pricesData = await pricesRes.json()
          setAvailablePrices(pricesData.prices || [])
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load room data')
    } finally {
      setLoading(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRoomBooking(null)
      setAvailablePrices([])
      setGuestCount(1)
      setSelectedPrices([])
      setError(null)
    }
  }, [isOpen])

  // Toggle optional price selection
  const togglePrice = (price: AvailableAdditionalPrice) => {
    if (price.mandatory) return // Can't toggle mandatory prices

    const existing = selectedPrices.find((p) => p.id === price.id)
    if (existing) {
      setSelectedPrices((prev) => prev.filter((p) => p.id !== price.id))
    } else {
      // Calculate default quantity
      let quantity = 1
      if (price.perNight && roomBooking) {
        // Would need nights - for now default to 1
        quantity = 1
      }
      if (price.perGuest) {
        quantity = guestCount
      }
      setSelectedPrices((prev) => [...prev, { id: price.id, quantity }])
    }
  }

  // Update quantity for a selected price
  const updatePriceQuantity = (priceId: string, quantity: number) => {
    setSelectedPrices((prev) =>
      prev.map((p) => (p.id === priceId ? { ...p, quantity } : p))
    )
  }

  // Handle save
  const handleSave = async () => {
    if (!groupId || !bookingId) return

    setSaving(true)
    setError(null)

    try {
      // Build additional prices data
      const additionalPricesData = selectedPrices.map((sp) => {
        const priceInfo = availablePrices.find((ap) => ap.id === sp.id)
        return {
          title: priceInfo?.title || '',
          priceEur: priceInfo?.priceEur || 0,
          quantity: sp.quantity,
        }
      })

      const res = await fetch(`/api/admin/booking-groups/${groupId}/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          guestCount,
          additionalPrices: additionalPricesData,
        }),
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save changes')
      }
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Separate mandatory and optional prices
  const mandatoryPrices = availablePrices.filter((p) => p.mandatory)
  const optionalPrices = availablePrices.filter((p) => !p.mandatory)

  if (!isOpen) return null

  const roomCapacity = roomBooking?.room.roomType?.capacity || 10

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Edit Room Booking</h2>
              <p className="text-sm text-stone-600">
                {roomBooking ? `${roomBooking.room.roomType?.building.name} / ${roomBooking.room.name}` : 'Loading...'}
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
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : roomBooking ? (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-700">
                <strong>Note:</strong> This room is part of a group booking. Dates and guest info are shared across all rooms in the group.
              </div>

              {/* Room Info */}
              <div>
                <h3 className="text-sm font-medium text-stone-700 mb-2">Room Details</h3>
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded">
                      {roomBooking.room.roomType?.building.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                      {roomBooking.room.roomType?.name ? getLocalizedText(roomBooking.room.roomType.name as Record<string, string>, language) : ''}
                    </span>
                  </div>
                  <p className="font-medium text-stone-900">{roomBooking.room.name}</p>
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <h3 className="text-sm font-medium text-stone-700 mb-2">Guest Count</h3>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  {Array.from({ length: roomCapacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} guest{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory Additional Prices */}
              {mandatoryPrices.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-stone-700 mb-2">Mandatory Fees</h3>
                  <div className="space-y-2">
                    {mandatoryPrices.map((price) => (
                      <div
                        key={price.id}
                        className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border border-amber-200"
                      >
                        <div>
                          <span className="text-sm font-medium text-stone-900">{price.title}</span>
                          <span className="text-xs text-stone-500 ml-2">
                            {price.perNight && 'per night '}
                            {price.perGuest && 'per guest'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-amber-700">{price.priceEur.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">Mandatory fees are automatically applied</p>
                </div>
              )}

              {/* Optional Additional Prices */}
              {optionalPrices.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-stone-700 mb-2">Optional Extras</h3>
                  <div className="space-y-2">
                    {optionalPrices.map((price) => {
                      const isSelected = selectedPrices.some((sp) => sp.id === price.id)
                      const selectedPrice = selectedPrices.find((sp) => sp.id === price.id)

                      return (
                        <div
                          key={price.id}
                          className={`rounded-lg p-3 border transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300'
                              : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePrice(price)}
                                className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="text-sm font-medium text-stone-900">{price.title}</span>
                                <span className="text-xs text-stone-500 ml-2">
                                  {price.perNight && 'per night '}
                                  {price.perGuest && 'per guest'}
                                </span>
                              </div>
                            </label>
                            <span className="text-sm font-medium text-stone-700">{price.priceEur.toFixed(2)} €</span>
                          </div>
                          {isSelected && (
                            <div className="mt-2 pl-7 flex items-center gap-2">
                              <label className="text-xs text-stone-500">Quantity:</label>
                              <input
                                type="number"
                                min="1"
                                value={selectedPrice?.quantity || 1}
                                onChange={(e) => updatePriceQuantity(price.id, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-stone-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                              <span className="text-xs text-indigo-600 font-medium">
                                = {((selectedPrice?.quantity || 1) * price.priceEur).toFixed(2)} €
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {availablePrices.length === 0 && (
                <div className="text-sm text-stone-500 text-center py-4">
                  No additional prices configured for this room type
                </div>
              )}
            </div>
          ) : null}
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
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
