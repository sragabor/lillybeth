'use client'

import { useState, useEffect, useMemo } from 'react'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface ExistingAdditionalPrice {
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
  additionalPrices: ExistingAdditionalPrice[]
}

interface GroupData {
  id: string
  checkIn: string
  checkOut: string
  bookings: RoomBooking[]
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
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [availablePrices, setAvailablePrices] = useState<AvailableAdditionalPrice[]>([])

  // Form state - only track which optional prices are selected (by source ID)
  const [guestCount, setGuestCount] = useState(1)
  const [selectedPriceIds, setSelectedPriceIds] = useState<Set<string>>(new Set())

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Calculate nights from group dates
  const nights = useMemo(() => {
    if (!groupData) return 1
    const checkIn = new Date(groupData.checkIn)
    const checkOut = new Date(groupData.checkOut)
    return Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
  }, [groupData])

  // Calculate quantity for a price based on rules
  const calculateQuantity = (price: AvailableAdditionalPrice): number => {
    let quantity = 1
    if (price.perNight) {
      quantity = nights
    }
    if (price.perGuest) {
      quantity *= guestCount
    }
    return quantity
  }

  // Calculate total for a price
  const calculatePriceTotal = (price: AvailableAdditionalPrice): number => {
    return price.priceEur * calculateQuantity(price)
  }

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
      // Fetch group data to get room booking and dates
      const groupRes = await fetch(`/api/admin/booking-groups/${groupId}`)
      if (!groupRes.ok) {
        setError('Failed to fetch group data')
        setLoading(false)
        return
      }

      const responseData = await groupRes.json()
      const group = responseData.group
      setGroupData({
        id: group.id,
        checkIn: group.checkIn,
        checkOut: group.checkOut,
        bookings: group.bookings,
      })

      const booking = group.bookings.find((b: RoomBooking) => b.id === bookingId)
      if (!booking) {
        setError('Room booking not found')
        setLoading(false)
        return
      }

      setRoomBooking(booking)
      setGuestCount(booking.guestCount)

      // Fetch available additional prices for this room's building and room type
      if (booking.room.roomType) {
        const pricesRes = await fetch(
          `/api/admin/additional-prices?roomTypeId=${booking.room.roomType.id}&buildingId=${booking.room.roomType.building.id}`
        )
        if (pricesRes.ok) {
          const pricesData = await pricesRes.json()
          const prices = pricesData.prices || []
          setAvailablePrices(prices)

          // Match existing prices by title to determine which are selected
          const existingTitles = new Set(booking.additionalPrices.map((p: ExistingAdditionalPrice) => p.title))
          const selectedIds = new Set<string>()

          prices.forEach((price: AvailableAdditionalPrice) => {
            // Mandatory prices are always selected
            if (price.mandatory) {
              selectedIds.add(price.id)
            } else if (existingTitles.has(price.title)) {
              // Match optional prices by title
              selectedIds.add(price.id)
            }
          })

          setSelectedPriceIds(selectedIds)
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
      setGroupData(null)
      setAvailablePrices([])
      setGuestCount(1)
      setSelectedPriceIds(new Set())
      setError(null)
    }
  }, [isOpen])

  // Toggle optional price selection
  const togglePrice = (price: AvailableAdditionalPrice) => {
    if (price.mandatory) return // Can't toggle mandatory prices

    setSelectedPriceIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(price.id)) {
        newSet.delete(price.id)
      } else {
        newSet.add(price.id)
      }
      return newSet
    })
  }

  // Handle save - send only selections, let backend calculate amounts
  const handleSave = async () => {
    if (!groupId || !bookingId) return

    setSaving(true)
    setError(null)

    try {
      // Build selections array with sourceId and sourceType only
      const additionalPriceSelections = availablePrices
        .filter((price) => selectedPriceIds.has(price.id) || price.mandatory)
        .map((price) => ({
          sourceId: price.id,
          sourceType: price.origin,
        }))

      const res = await fetch(`/api/admin/booking-groups/${groupId}/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          guestCount,
          additionalPriceSelections, // Only IDs, no amounts
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

  // Calculate estimated room total for display
  const estimatedTotal = useMemo(() => {
    let total = 0
    availablePrices.forEach((price) => {
      if (selectedPriceIds.has(price.id) || price.mandatory) {
        total += calculatePriceTotal(price)
      }
    })
    return total
  }, [availablePrices, selectedPriceIds, guestCount, nights])

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
                <strong>Note:</strong> This room is part of a group booking ({nights} night{nights > 1 ? 's' : ''}).
                Dates and guest info are shared across all rooms in the group.
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
                    {mandatoryPrices.map((price) => {
                      const quantity = calculateQuantity(price)
                      const total = calculatePriceTotal(price)

                      return (
                        <div
                          key={price.id}
                          className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border border-amber-200"
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium text-stone-900">{price.title}</span>
                            <div className="text-xs text-stone-500 mt-0.5">
                              {price.priceEur.toFixed(2)} € × {quantity}
                              {price.perNight && price.perGuest && ` (${nights} nights × ${guestCount} guests)`}
                              {price.perNight && !price.perGuest && ` (${nights} nights)`}
                              {!price.perNight && price.perGuest && ` (${guestCount} guests)`}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-amber-700">{total.toFixed(2)} €</span>
                        </div>
                      )
                    })}
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
                      const isSelected = selectedPriceIds.has(price.id)
                      const quantity = calculateQuantity(price)
                      const total = calculatePriceTotal(price)

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
                              <div className="flex-1">
                                <span className="text-sm font-medium text-stone-900">{price.title}</span>
                                {isSelected && (
                                  <div className="text-xs text-stone-500 mt-0.5">
                                    {price.priceEur.toFixed(2)} € × {quantity}
                                    {price.perNight && price.perGuest && ` (${nights} nights × ${guestCount} guests)`}
                                    {price.perNight && !price.perGuest && ` (${nights} nights)`}
                                    {!price.perNight && price.perGuest && ` (${guestCount} guests)`}
                                  </div>
                                )}
                              </div>
                            </label>
                            <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-stone-500'}`}>
                              {isSelected ? `${total.toFixed(2)} €` : `${price.priceEur.toFixed(2)} €/unit`}
                            </span>
                          </div>
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

              {/* Estimated Total */}
              {availablePrices.length > 0 && (
                <div className="bg-stone-100 rounded-lg p-4 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">Estimated Additional Fees Total</span>
                    <span className="text-lg font-semibold text-stone-900">{estimatedTotal.toFixed(2)} €</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Final amounts are calculated server-side based on pricing rules
                  </p>
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
