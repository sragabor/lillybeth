'use client'

import { useState, useEffect } from 'react'
import {
  Booking,
  BookingFormData,
  AvailableRoom,
  PriceBreakdown,
  DEFAULT_BOOKING_FORM,
  STATUS_LABELS,
  PAYMENT_LABELS,
} from '../types'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingBooking: Booking | null
  availableRooms: AvailableRoom[]
  initialRoomId?: string
  initialDate?: string
}

export default function BookingModal({
  isOpen,
  onClose,
  onSave,
  editingBooking,
  availableRooms,
  initialRoomId,
  initialDate,
}: BookingModalProps) {
  const [bookingForm, setBookingForm] = useState<BookingFormData>(DEFAULT_BOOKING_FORM)
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [selectedPriceIds, setSelectedPriceIds] = useState<Set<string>>(new Set())

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingBooking) {
        // Edit mode
        const existingPriceIds = new Set(editingBooking.additionalPrices.map((p) => p.id))
        setSelectedPriceIds(existingPriceIds)
        setBookingForm({
          roomId: editingBooking.roomId,
          source: editingBooking.source,
          guestName: editingBooking.guestName,
          guestEmail: editingBooking.guestEmail || '',
          guestPhone: editingBooking.guestPhone || '',
          guestCount: editingBooking.guestCount.toString(),
          checkIn: editingBooking.checkIn.split('T')[0],
          checkOut: editingBooking.checkOut.split('T')[0],
          status: editingBooking.status,
          paymentStatus: editingBooking.paymentStatus,
          notes: editingBooking.notes || '',
          totalAmount: editingBooking.totalAmount?.toString() || '',
        })
      } else {
        // Create mode
        setSelectedPriceIds(new Set())
        setBookingForm({
          ...DEFAULT_BOOKING_FORM,
          roomId: initialRoomId || '',
          checkIn: initialDate || new Date().toISOString().split('T')[0],
          checkOut: initialDate
            ? new Date(new Date(initialDate).getTime() + 86400000).toISOString().split('T')[0]
            : '',
        })
      }
      setPriceBreakdown(null)
    }
  }, [isOpen, editingBooking, initialRoomId, initialDate])

  // Calculate price
  const calculatePrice = async (priceIds?: Set<string>) => {
    if (!bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut) {
      alert('Please select a room and dates first')
      return
    }

    const idsToUse = priceIds ?? selectedPriceIds

    setCalculatingPrice(true)
    try {
      const res = await fetch('/api/admin/bookings/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: bookingForm.roomId,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          selectedPriceIds: Array.from(idsToUse),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPriceBreakdown(data.breakdown)
        setBookingForm((prev) => ({
          ...prev,
          totalAmount: data.breakdown.grandTotal.toString(),
        }))
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to calculate price')
      }
    } catch (error) {
      console.error('Error calculating price:', error)
    } finally {
      setCalculatingPrice(false)
    }
  }

  // Toggle optional additional price selection
  const toggleAdditionalPrice = (priceId: string) => {
    const newSelection = new Set(selectedPriceIds)
    if (newSelection.has(priceId)) {
      newSelection.delete(priceId)
    } else {
      newSelection.add(priceId)
    }
    setSelectedPriceIds(newSelection)
    // Auto-recalculate when selection changes
    if (bookingForm.roomId && bookingForm.checkIn && bookingForm.checkOut) {
      calculatePrice(newSelection)
    }
  }

  // Validate booking form
  const validateBookingForm = (): string | null => {
    if (!bookingForm.roomId) return 'Please select a room'
    if (!bookingForm.guestName.trim()) return 'Guest name is required'
    if (!bookingForm.guestEmail.trim()) return 'Email is required'
    if (!bookingForm.guestPhone.trim()) return 'Phone is required'
    if (!bookingForm.guestCount || parseInt(bookingForm.guestCount) < 1)
      return 'Number of guests must be at least 1'
    if (!bookingForm.checkIn) return 'Check-in date is required'
    if (!bookingForm.checkOut) return 'Check-out date is required'
    if (new Date(bookingForm.checkOut) <= new Date(bookingForm.checkIn)) {
      return 'Check-out date must be after check-in date'
    }
    return null
  }

  // Save booking
  const handleSaveBooking = async () => {
    const validationError = validateBookingForm()
    if (validationError) {
      alert(validationError)
      return
    }

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
        onClose()
        onSave()
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
        onClose()
        onSave()
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  if (!isOpen) return null

  const isCancelled = editingBooking?.status === 'CANCELLED'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          {editingBooking ? 'Edit Booking' : 'New Booking'}
        </h3>

        {isCancelled && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              This booking has been cancelled and cannot be edited.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Room <span className="text-red-500">*</span>
            </label>
            <select
              value={bookingForm.roomId}
              onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
              required
              disabled={isCancelled}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a room</option>
              {availableRooms
                .filter(({ room }) => room.isActive)
                .map(({ room, building, roomType }) => (
                  <option key={room.id} value={room.id}>
                    {building} / {roomType} / {room.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Source <span className="text-red-500">*</span>
            </label>
            <select
              value={bookingForm.source}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, source: e.target.value as BookingFormData['source'] })
              }
              required
              disabled={isCancelled}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed"
            >
              <option value="MANUAL">Manual</option>
              <option value="WEBSITE">Website</option>
              <option value="BOOKING_COM">Booking.com</option>
              <option value="SZALLAS_HU">Szállás.hu</option>
              <option value="AIRBNB">Airbnb</option>
            </select>
          </div>

          {/* Guest Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bookingForm.guestName}
              onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
              required
              disabled={isCancelled}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Guest Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={bookingForm.guestEmail}
                onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                required
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={bookingForm.guestPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                required
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Number of Guests <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={bookingForm.guestCount}
              onChange={(e) => setBookingForm({ ...bookingForm, guestCount: e.target.value })}
              required
              disabled={isCancelled}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Check-in <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={bookingForm.checkIn}
                onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                required
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Check-out <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={bookingForm.checkOut}
                onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                required
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
              <select
                value={bookingForm.status}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, status: e.target.value as BookingFormData['status'] })
                }
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Payment Status</label>
              <select
                value={bookingForm.paymentStatus}
                onChange={(e) =>
                  setBookingForm({
                    ...bookingForm,
                    paymentStatus: e.target.value as BookingFormData['paymentStatus'],
                  })
                }
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
              >
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Calculation */}
          {!isCancelled && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-stone-700">
                  Price Calculation <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => calculatePrice()}
                  disabled={calculatingPrice || !bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut}
                  className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                >
                  {calculatingPrice ? 'Calculating...' : 'Calculate Price'}
                </button>
              </div>

              {priceBreakdown && (
                <div className="p-4 bg-stone-50 rounded-lg space-y-3">
                  {/* Accommodation */}
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">
                      {priceBreakdown.nights} night{priceBreakdown.nights !== 1 ? 's' : ''} accommodation
                    </span>
                    <span className="font-medium text-stone-800">
                      {priceBreakdown.accommodationTotal.toFixed(2)} EUR
                    </span>
                  </div>

                  {/* Additional Prices Checkboxes */}
                  {priceBreakdown.availableAdditionalPrices.length > 0 && (
                    <div className="border-t border-stone-200 pt-3">
                      <p className="text-sm font-medium text-stone-700 mb-2">Additional Prices</p>

                      {/* Building-level prices */}
                      {priceBreakdown.availableAdditionalPrices.some((p) => p.origin === 'building') && (
                        <div className="mb-2">
                          <p className="text-xs text-stone-500 mb-1">Building</p>
                          <div className="space-y-1">
                            {priceBreakdown.availableAdditionalPrices
                              .filter((p) => p.origin === 'building')
                              .map((price) => (
                                <label
                                  key={price.id}
                                  className={`flex items-center justify-between p-2 rounded ${
                                    price.mandatory ? 'bg-amber-50' : 'hover:bg-stone-100'
                                  } cursor-pointer`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={price.mandatory || selectedPriceIds.has(price.id)}
                                      disabled={price.mandatory}
                                      onChange={() => !price.mandatory && toggleAdditionalPrice(price.id)}
                                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-stone-700">
                                      {price.title}
                                      {price.mandatory && (
                                        <span className="ml-1 text-xs text-amber-600">(Required)</span>
                                      )}
                                      {price.perNight && (
                                        <span className="ml-1 text-xs text-stone-500">/night</span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-stone-700">
                                    {price.priceEur.toFixed(2)} EUR
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Room Type-level prices */}
                      {priceBreakdown.availableAdditionalPrices.some((p) => p.origin === 'roomType') && (
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Room Type</p>
                          <div className="space-y-1">
                            {priceBreakdown.availableAdditionalPrices
                              .filter((p) => p.origin === 'roomType')
                              .map((price) => (
                                <label
                                  key={price.id}
                                  className={`flex items-center justify-between p-2 rounded ${
                                    price.mandatory ? 'bg-amber-50' : 'hover:bg-stone-100'
                                  } cursor-pointer`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={price.mandatory || selectedPriceIds.has(price.id)}
                                      disabled={price.mandatory}
                                      onChange={() => !price.mandatory && toggleAdditionalPrice(price.id)}
                                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-stone-700">
                                      {price.title}
                                      {price.mandatory && (
                                        <span className="ml-1 text-xs text-amber-600">(Required)</span>
                                      )}
                                      {price.perNight && (
                                        <span className="ml-1 text-xs text-stone-500">/night</span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-stone-700">
                                    {price.priceEur.toFixed(2)} EUR
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Additional Prices Summary */}
                  {priceBreakdown.additionalPrices.length > 0 && (
                    <div className="border-t border-stone-200 pt-2">
                      {priceBreakdown.additionalPrices.map((price) => (
                        <div key={price.id} className="flex justify-between text-sm text-stone-600">
                          <span>
                            {price.title}
                            {price.quantity > 1 && ` x${price.quantity}`}
                          </span>
                          <span>{price.total.toFixed(2)} EUR</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-300">
                    <span>Total</span>
                    <span>{priceBreakdown.grandTotal.toFixed(2)} EUR</span>
                  </div>
                </div>
              )}

              {!priceBreakdown && (
                <p className="text-sm text-stone-500 italic">
                  Select room and dates, then click &quot;Calculate Price&quot;
                </p>
              )}
            </div>
          )}

          {/* Total Amount (Manual Override) */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Total Amount (EUR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={bookingForm.totalAmount}
              onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
              placeholder="Calculated or enter manually"
              required
              disabled={isCancelled}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-stone-500">
              Auto-filled from calculation. You can override if needed.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              rows={3}
              disabled={isCancelled}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none disabled:bg-stone-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          {editingBooking && !isCancelled ? (
            <button
              onClick={handleDeleteBooking}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              Delete
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              {isCancelled ? 'Close' : 'Cancel'}
            </button>
            {!isCancelled && (
              <button
                onClick={handleSaveBooking}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                {editingBooking ? 'Update' : 'Create'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
