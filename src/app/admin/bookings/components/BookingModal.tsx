'use client'

import { useState, useEffect } from 'react'
import {
  Booking,
  BookingFormData,
  BookingStatus,
  AvailableRoom,
  PriceBreakdown,
  Payment,
  PaymentMethod,
  PaymentCurrency,
  DEFAULT_BOOKING_FORM,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ACTION_LABELS,
  PAYMENT_LABELS,
  PAYMENT_COLORS,
  PAYMENT_METHOD_LABELS,
  getNextStatus,
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

  // Status confirmation modal state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Payment management state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<{
    totalAmount: number | null
    totalPaid: number
    remaining: number
    paymentStatus: string
  } | null>(null)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'EUR' as PaymentCurrency,
    method: 'CASH' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [savingPayment, setSavingPayment] = useState(false)

  // Alert modal state (replaces browser alerts)
  const [alertModal, setAlertModal] = useState<{ message: string; type: 'error' | 'info' } | null>(null)

  // Delete confirmation modals
  const [showDeleteBookingConfirm, setShowDeleteBookingConfirm] = useState(false)
  const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState(false)
  const [pendingDeletePaymentId, setPendingDeletePaymentId] = useState<string | null>(null)

  // Status tracking checkboxes
  const [invoiceSent, setInvoiceSent] = useState(false)
  const [vendegem, setVendegem] = useState(false)
  const [cleaned, setCleaned] = useState(false)

  // Load price breakdown for edit mode and match existing additional prices by title
  const loadEditModePrice = async (
    roomId: string,
    checkIn: string,
    checkOut: string,
    existingPrices: { title: string }[]
  ) => {
    setCalculatingPrice(true)
    try {
      const res = await fetch('/api/admin/bookings/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          selectedPriceIds: [], // First pass to get available prices
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const breakdown = data.breakdown

        // Match existing additional prices by title to find the correct IDs
        const existingTitles = new Set(existingPrices.map((p) => p.title))
        const matchedIds = new Set<string>()

        for (const availablePrice of breakdown.availableAdditionalPrices) {
          if (existingTitles.has(availablePrice.title) || availablePrice.mandatory) {
            matchedIds.add(availablePrice.id)
          }
        }

        setSelectedPriceIds(matchedIds)

        // Recalculate with matched IDs to get correct totals
        const res2 = await fetch('/api/admin/bookings/calculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            checkIn,
            checkOut,
            selectedPriceIds: Array.from(matchedIds),
          }),
        })

        if (res2.ok) {
          const data2 = await res2.json()
          setPriceBreakdown(data2.breakdown)
        }
      }
    } catch (error) {
      console.error('Error loading edit mode price:', error)
    } finally {
      setCalculatingPrice(false)
    }
  }

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingBooking) {
        // Edit mode
        const checkIn = editingBooking.checkIn.split('T')[0]
        const checkOut = editingBooking.checkOut.split('T')[0]

        setBookingForm({
          roomId: editingBooking.roomId,
          source: editingBooking.source,
          guestName: editingBooking.guestName,
          guestEmail: editingBooking.guestEmail || '',
          guestPhone: editingBooking.guestPhone || '',
          guestCount: editingBooking.guestCount.toString(),
          checkIn,
          checkOut,
          arrivalTime: editingBooking.arrivalTime || '',
          status: editingBooking.status,
          paymentStatus: editingBooking.paymentStatus,
          notes: editingBooking.notes || '',
          totalAmount: editingBooking.totalAmount?.toString() || '',
        })

        // Auto-load price breakdown and match existing additional prices
        loadEditModePrice(
          editingBooking.roomId,
          checkIn,
          checkOut,
          editingBooking.additionalPrices
        )

        // Load payments for this booking
        loadPayments(editingBooking.id)

        // Initialize status checkboxes
        setInvoiceSent(editingBooking.invoiceSent || false)
        setVendegem(editingBooking.vendegem || false)
        setCleaned(editingBooking.cleaned || false)
      } else {
        // Reset payment state for new bookings
        setPayments([])
        setPaymentSummary(null)
        setShowPaymentForm(false)

        // Reset status checkboxes
        setInvoiceSent(false)
        setVendegem(false)
        setCleaned(false)
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
        setPriceBreakdown(null)
      }
    }
  }, [isOpen, editingBooking, initialRoomId, initialDate])

  // Calculate price
  const calculatePrice = async (priceIds?: Set<string>) => {
    if (!bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut) {
      setAlertModal({ message: 'Please select a room and dates first', type: 'info' })
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
        setAlertModal({ message: error.error || 'Failed to calculate price', type: 'error' })
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

  // Get selected room's capacity
  const getSelectedRoomCapacity = (): number => {
    const selectedRoom = availableRooms.find((r) => r.room.id === bookingForm.roomId)
    return selectedRoom?.capacity || 10 // Default to 10 if not found
  }

  // Validate booking form
  const validateBookingForm = (): string | null => {
    if (!bookingForm.roomId) return 'Please select a room'
    if (!bookingForm.guestName.trim()) return 'Guest name is required'
    // Email and Phone are optional
    const guestCount = parseInt(bookingForm.guestCount)
    if (!bookingForm.guestCount || guestCount < 1)
      return 'Number of guests must be at least 1'
    const capacity = getSelectedRoomCapacity()
    if (guestCount > capacity)
      return `Number of guests cannot exceed room capacity (${capacity})`
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
      setAlertModal({ message: validationError, type: 'error' })
      return
    }

    try {
      const url = editingBooking
        ? `/api/admin/bookings/${editingBooking.id}`
        : '/api/admin/bookings'
      const method = editingBooking ? 'PUT' : 'POST'

      // Build additional prices data from price breakdown
      const additionalPricesData = priceBreakdown?.additionalPrices.map((price) => ({
        title: price.title,
        priceEur: price.priceEur,
        quantity: price.quantity,
      })) || []

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          additionalPrices: additionalPricesData,
          // Status tracking checkboxes
          invoiceSent,
          vendegem,
          cleaned,
        }),
      })

      if (res.ok) {
        onClose()
        onSave()
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to save booking', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving booking:', error)
    }
  }

  // Delete booking - show confirmation modal
  const handleDeleteBooking = () => {
    if (!editingBooking) return
    setShowDeleteBookingConfirm(true)
  }

  // Confirm delete booking
  const confirmDeleteBooking = async () => {
    if (!editingBooking) return

    try {
      const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowDeleteBookingConfirm(false)
        onClose()
        onSave()
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to delete booking', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      setAlertModal({ message: 'Failed to delete booking', type: 'error' })
    }
  }

  // Initiate status change (opens confirmation modal)
  const handleStatusChange = (newStatus: BookingStatus) => {
    setPendingStatus(newStatus)
    setShowStatusConfirm(true)
  }

  // Confirm and execute status change
  const confirmStatusChange = async () => {
    if (!editingBooking || !pendingStatus) return

    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus }),
      })

      if (res.ok) {
        setShowStatusConfirm(false)
        setPendingStatus(null)
        onClose()
        onSave()
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to update status', type: 'error' })
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Cancel booking (with refund)
  const confirmCancelBooking = async () => {
    if (!editingBooking) return

    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        }),
      })

      if (res.ok) {
        setShowCancelConfirm(false)
        onClose()
        onSave()
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to cancel booking', type: 'error' })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Load payments for a booking
  const loadPayments = async (bookingId: string) => {
    setLoadingPayments(true)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/payments`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setPaymentSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  // Add a new payment
  const handleAddPayment = async () => {
    if (!editingBooking || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setAlertModal({ message: 'Please enter a valid amount', type: 'info' })
      return
    }

    setSavingPayment(true)
    try {
      const res = await fetch(`/api/admin/bookings/${editingBooking.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })

      if (res.ok) {
        // Reload payments
        await loadPayments(editingBooking.id)
        // Reset form
        setPaymentForm({
          amount: '',
          currency: 'EUR',
          method: 'CASH',
          date: new Date().toISOString().split('T')[0],
          note: '',
        })
        setShowPaymentForm(false)
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to add payment', type: 'error' })
      }
    } catch (error) {
      console.error('Error adding payment:', error)
    } finally {
      setSavingPayment(false)
    }
  }

  // Delete a payment - show confirmation modal
  const handleDeletePayment = (paymentId: string) => {
    if (!editingBooking) return
    setPendingDeletePaymentId(paymentId)
    setShowDeletePaymentConfirm(true)
  }

  // Confirm delete payment
  const confirmDeletePayment = async () => {
    if (!editingBooking || !pendingDeletePaymentId) return

    try {
      const res = await fetch(
        `/api/admin/bookings/${editingBooking.id}/payments?paymentId=${pendingDeletePaymentId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        setShowDeletePaymentConfirm(false)
        setPendingDeletePaymentId(null)
        await loadPayments(editingBooking.id)
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to delete payment', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      setAlertModal({ message: 'Failed to delete payment', type: 'error' })
    }
  }

  // Get current status info
  const currentStatus = editingBooking?.status || 'INCOMING'
  const nextStatus = getNextStatus(currentStatus)

  if (!isOpen) return null

  const isCancelled = editingBooking?.status === 'CANCELLED'
  // Price editing is locked for CONFIRMED, CHECKED_IN, CHECKED_OUT, and CANCELLED statuses
  const isPriceLocked = Boolean(editingBooking && ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].includes(editingBooking.status))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-0">
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Booking Details</h4>

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
                <option value="MANUAL">Direct</option>
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
                  Email
                </label>
                <input
                  type="email"
                  value={bookingForm.guestEmail}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                  disabled={isCancelled}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={bookingForm.guestPhone}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                  disabled={isCancelled}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Number of Guests <span className="text-red-500">*</span>
                {bookingForm.roomId && (
                  <span className="text-stone-500 font-normal ml-1">
                    (max {getSelectedRoomCapacity()})
                  </span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max={bookingForm.roomId ? getSelectedRoomCapacity() : undefined}
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

            {/* Arrival Time */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Arrival Time
              </label>
              <input
                type="time"
                value={bookingForm.arrivalTime}
                onChange={(e) => setBookingForm({ ...bookingForm, arrivalTime: e.target.value })}
                disabled={isCancelled}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-stone-500">Expected arrival time (optional)</p>
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

            {/* Status Tracking Checkboxes - Only show in edit mode */}
            {editingBooking && (
              <div className="pt-4 border-t border-stone-200">
                <label className="block text-sm font-medium text-stone-700 mb-3">Status Tracking</label>
                {(() => {
                  // Checkboxes are disabled when status is CHECKED_OUT and checkout date is in the past
                  const isCheckedOut = editingBooking.status === 'CHECKED_OUT'
                  const checkoutDate = new Date(editingBooking.checkOut)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const isCheckoutPast = checkoutDate < today
                  const areCheckboxesLocked = isCheckedOut && isCheckoutPast

                  return (
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 ${areCheckboxesLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={invoiceSent}
                          onChange={(e) => setInvoiceSent(e.target.checked)}
                          disabled={areCheckboxesLocked}
                          className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-stone-700">Invoice</span>
                      </label>
                      <label className={`flex items-center gap-2 ${areCheckboxesLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={vendegem}
                          onChange={(e) => setVendegem(e.target.checked)}
                          disabled={areCheckboxesLocked}
                          className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-stone-700">Vendégem</span>
                      </label>
                      <label className={`flex items-center gap-2 ${areCheckboxesLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={cleaned}
                          onChange={(e) => setCleaned(e.target.checked)}
                          disabled={areCheckboxesLocked}
                          className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-stone-700">Cleaned</span>
                      </label>
                      {areCheckboxesLocked && (
                        <p className="text-xs text-stone-500 mt-2">
                          These options are locked for past checked-out bookings.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Right Column - Price & Status */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Price & Payment</h4>

            {/* Price Calculation */}
            {!isCancelled && (
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-stone-700">Price Breakdown</label>
                  {!isPriceLocked && (
                    <button
                      type="button"
                      onClick={() => calculatePrice()}
                      disabled={calculatingPrice || !bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut}
                      className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                    >
                      {calculatingPrice ? 'Calculating...' : 'Recalculate'}
                    </button>
                  )}
                </div>

                {priceBreakdown ? (
                  <div className="space-y-3 relative">
                    {/* Loading Overlay */}
                    {calculatingPrice && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-600">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-sm font-medium">Calculating...</span>
                        </div>
                      </div>
                    )}

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
                                      price.mandatory ? 'bg-amber-50' : isPriceLocked ? '' : 'hover:bg-white'
                                    } ${isPriceLocked ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={price.mandatory || selectedPriceIds.has(price.id)}
                                        disabled={price.mandatory || isPriceLocked}
                                        onChange={() => !price.mandatory && !isPriceLocked && toggleAdditionalPrice(price.id)}
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
                                      price.mandatory ? 'bg-amber-50' : isPriceLocked ? '' : 'hover:bg-white'
                                    } ${isPriceLocked ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={price.mandatory || selectedPriceIds.has(price.id)}
                                        disabled={price.mandatory || isPriceLocked}
                                        onChange={() => !price.mandatory && !isPriceLocked && toggleAdditionalPrice(price.id)}
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
                      <span>Calculated Total</span>
                      <span>{priceBreakdown.grandTotal.toFixed(2)} EUR</span>
                    </div>
                  </div>
                ) : calculatingPrice ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-amber-600">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm font-medium">Calculating price...</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 italic">
                    Select room and dates to see price breakdown
                  </p>
                )}
              </div>
            )}

            {/* Total Amount (Manual Override) */}
            <div className="bg-amber-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Final Amount (EUR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={bookingForm.totalAmount}
                onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
                placeholder="Enter amount"
                required
                disabled={isCancelled || isPriceLocked}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white disabled:bg-stone-100 disabled:cursor-not-allowed text-lg font-semibold"
              />
              <p className="mt-1 text-xs text-stone-500">
                {isPriceLocked ? 'Price is locked after booking is confirmed.' : 'Auto-filled from calculation. Override if needed.'}
              </p>
            </div>

            {/* Payment Status Select */}
            {editingBooking && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={bookingForm.paymentStatus}
                  onChange={(e) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value as BookingFormData['paymentStatus'] })}
                  disabled={isCancelled}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed ${
                    PAYMENT_COLORS[bookingForm.paymentStatus as keyof typeof PAYMENT_COLORS]?.bg || 'bg-white'
                  } ${
                    PAYMENT_COLORS[bookingForm.paymentStatus as keyof typeof PAYMENT_COLORS]?.text || 'text-stone-900'
                  } border-stone-300`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="FULLY_PAID">Fully Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <p className="mt-1 text-xs text-stone-500">
                  Manually adjust payment status if needed. This is updated automatically when payments are recorded.
                </p>
              </div>
            )}

            {/* Status Controls */}
            {editingBooking && (
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-stone-700 mb-3">Booking Status</h5>

                {/* Current Status Display */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-stone-600">Current:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[currentStatus].bg} ${STATUS_COLORS[currentStatus].text}`}>
                    {STATUS_LABELS[currentStatus]}
                  </span>
                </div>

                {/* Status Actions */}
                {!isCancelled && (
                  <div className="space-y-2">
                    {/* Next Status Button */}
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusChange(nextStatus)}
                        disabled={updatingStatus}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {STATUS_ACTION_LABELS[currentStatus]}
                      </button>
                    )}

                    {/* Completed Status Message */}
                    {!nextStatus && currentStatus === 'CHECKED_OUT' && (
                      <div className="text-center py-2 text-sm text-emerald-600">
                        <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Booking completed
                      </div>
                    )}

                    {/* Cancel Booking Button - Hidden for completed bookings */}
                    {currentStatus !== 'CHECKED_OUT' && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={updatingStatus}
                        className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Booking
                      </button>
                    )}
                  </div>
                )}

                {/* Cancelled Status Message */}
                {isCancelled && (
                  <div className="text-center py-2 text-sm text-red-600">
                    <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    This booking has been cancelled
                  </div>
                )}
              </div>
            )}

            {/* Payment Tracking Section */}
            {editingBooking && (
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-stone-700">Payment Tracking</h5>
                  {paymentSummary && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[paymentSummary.paymentStatus as keyof typeof PAYMENT_COLORS]?.bg || 'bg-stone-100'} ${PAYMENT_COLORS[paymentSummary.paymentStatus as keyof typeof PAYMENT_COLORS]?.text || 'text-stone-700'}`}>
                      {PAYMENT_LABELS[paymentSummary.paymentStatus as keyof typeof PAYMENT_LABELS] || paymentSummary.paymentStatus}
                    </span>
                  )}
                </div>

                {/* Payment Summary */}
                {paymentSummary && (
                  <div className="bg-stone-50 rounded-lg p-3 mb-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Total Amount:</span>
                      <span className="font-medium">{paymentSummary.totalAmount?.toFixed(2) || '0.00'} EUR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Total Paid:</span>
                      <span className="font-medium text-green-600">{paymentSummary.totalPaid.toFixed(2)} EUR</span>
                    </div>
                    {paymentSummary.remaining > 0 && (
                      <div className="flex justify-between text-sm font-medium pt-1 border-t border-stone-200">
                        <span className="text-stone-700">Remaining:</span>
                        <span className="text-amber-600">{paymentSummary.remaining.toFixed(2)} EUR</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment List */}
                {loadingPayments ? (
                  <div className="text-center py-4 text-sm text-stone-500">Loading payments...</div>
                ) : payments.length > 0 ? (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{payment.amount.toFixed(2)} {payment.currency}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                              {PAYMENT_METHOD_LABELS[payment.method]}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            {new Date(payment.date).toLocaleDateString()}
                            {payment.note && <span className="ml-2 italic">{payment.note}</span>}
                          </div>
                        </div>
                        {!isCancelled && (
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete payment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-sm text-stone-500 mb-3">
                    No payments recorded yet
                  </div>
                )}

                {/* Add Payment Form */}
                {!isCancelled && (
                  <>
                    {showPaymentForm ? (
                      <div className="border border-stone-200 rounded-lg p-3 bg-stone-50 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">Currency</label>
                            <select
                              value={paymentForm.currency}
                              onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value as PaymentCurrency })}
                              className="w-full px-2 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 text-sm cursor-pointer"
                            >
                              <option value="EUR">EUR</option>
                              <option value="HUF">HUF</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">Method</label>
                            <select
                              value={paymentForm.method}
                              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                              className="w-full px-2 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 text-sm cursor-pointer"
                            >
                              <option value="CASH">Cash</option>
                              <option value="TRANSFER">Bank Transfer</option>
                              <option value="CREDIT_CARD">Credit Card</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={paymentForm.date}
                            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                            className="w-full px-2 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 text-sm cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">Note (optional)</label>
                          <input
                            type="text"
                            value={paymentForm.note}
                            onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                            placeholder="e.g., Deposit"
                            className="w-full px-2 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 text-sm"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setShowPaymentForm(false)}
                            disabled={savingPayment}
                            className="flex-1 px-3 py-1.5 border border-stone-300 text-stone-600 rounded hover:bg-white transition-colors text-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddPayment}
                            disabled={savingPayment || !paymentForm.amount}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 text-sm cursor-pointer"
                          >
                            {savingPayment ? 'Saving...' : 'Add Payment'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full px-3 py-2 border border-dashed border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Record Payment
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Footer Actions - Sticky */}
        <div className="flex justify-between p-6 pt-4 border-t border-stone-200 bg-white rounded-b-xl">
          {editingBooking && !isCancelled ? (
            <button
              onClick={handleDeleteBooking}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              Delete Booking
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
                {editingBooking ? 'Update Booking' : 'Create Booking'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && pendingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Confirm Status Change</h3>
            <p className="text-stone-600 mb-6">
              Are you sure you want to change the booking status from{' '}
              <span className="font-medium">{STATUS_LABELS[currentStatus]}</span> to{' '}
              <span className="font-medium">{STATUS_LABELS[pendingStatus]}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusConfirm(false)
                  setPendingStatus(null)
                }}
                disabled={updatingStatus}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updatingStatus}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updatingStatus ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {showCancelConfirm && editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Cancel Booking</h3>
            <p className="text-stone-600 mb-4">
              Are you sure you want to cancel this booking?
            </p>

            {/* Payment Info */}
            <div className="bg-stone-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-stone-600">
                <span className="font-medium">Guest:</span> {editingBooking.guestName}
              </p>
              <p className="text-sm text-stone-600">
                <span className="font-medium">Total Amount:</span>{' '}
                {editingBooking.totalAmount?.toFixed(2) || '0.00'} EUR
              </p>
              {editingBooking.paymentStatus !== 'PENDING' && (
                <p className="text-sm text-amber-600 mt-2">
                  <span className="font-medium">Note:</span> Payment status will be set to Refunded.
                  Please ensure any received payments are refunded to the guest.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={updatingStatus}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={updatingStatus}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {updatingStatus ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Booking Confirmation Modal */}
      {showDeleteBookingConfirm && editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Booking</h3>
              <button
                onClick={() => setShowDeleteBookingConfirm(false)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-stone-600 mb-4">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="bg-stone-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-stone-700">
                <span className="font-medium">Guest:</span> {editingBooking.guestName}
              </p>
              <p className="text-sm text-stone-700">
                <span className="font-medium">Room:</span> {editingBooking.room?.name}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteBookingConfirm(false)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      {showDeletePaymentConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Payment</h3>
              <button
                onClick={() => {
                  setShowDeletePaymentConfirm(false)
                  setPendingDeletePaymentId(null)
                }}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-stone-600 mb-6">
              Are you sure you want to delete this payment entry? This will update the payment status accordingly.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeletePaymentConfirm(false)
                  setPendingDeletePaymentId(null)
                }}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePayment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal (replaces browser alerts) */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${alertModal.type === 'error' ? 'text-red-600' : 'text-stone-900'}`}>
                {alertModal.type === 'error' ? 'Error' : 'Notice'}
              </h3>
              <button
                onClick={() => setAlertModal(null)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-stone-600 mb-6">{alertModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertModal(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
