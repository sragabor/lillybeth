'use client'

import { useState, useEffect } from 'react'
import {
  BookingStatus,
  PaymentStatus,
  Payment,
  PaymentMethod,
  PaymentCurrency,
  BookingSource,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ACTION_LABELS,
  PAYMENT_LABELS,
  PAYMENT_COLORS,
  PAYMENT_METHOD_LABELS,
  SOURCE_LABELS,
  SOURCE_ICONS,
  getNextStatus,
} from '../types'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import RoomInGroupEditModal from './RoomInGroupEditModal'

interface GroupRoom {
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
  additionalPrices: { id: string; title: string; priceEur: number; quantity: number }[]
}

interface RoomPriceBreakdown {
  roomId: string
  roomName: string
  accommodationTotal: number
  mandatoryTotal: number
  roomTotal: number
}

interface BookingGroup {
  id: string
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  source: BookingSource
  checkIn: string
  checkOut: string
  arrivalTime: string | null
  notes: string | null
  status: BookingStatus
  paymentStatus: PaymentStatus
  totalAmount: number | null
  hasCustomHufPrice: boolean
  customHufPrice: number | null
  invoiceSent: boolean
  vendegem: boolean
  cleaned: boolean
  bookings: GroupRoom[]
  payments: Payment[]
  totalGuests?: number
  roomCount?: number
  nights?: number
}

interface BookingGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  groupId: string | null
}

export default function BookingGroupModal({
  isOpen,
  onClose,
  onSave,
  groupId,
}: BookingGroupModalProps) {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [group, setGroup] = useState<BookingGroup | null>(null)

  // Form state
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [notes, setNotes] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [hasCustomHufPrice, setHasCustomHufPrice] = useState(false)
  const [customHufPrice, setCustomHufPrice] = useState('')
  const [invoiceSent, setInvoiceSent] = useState(false)
  const [vendegem, setVendegem] = useState(false)
  const [cleaned, setCleaned] = useState(false)

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Payment state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<{
    totalAmount: number | null
    hasCustomHufPrice: boolean
    customHufPrice: number | null
    totalPaid: number
    paidEur: number
    paidHuf: number
    remaining: number
    paymentStatus: string
  } | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'EUR' as PaymentCurrency,
    method: 'CASH' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [savingPayment, setSavingPayment] = useState(false)

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{ message: string; type: 'error' | 'info' } | null>(null)

  // Delete confirmation
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState(false)
  const [pendingDeletePaymentId, setPendingDeletePaymentId] = useState<string | null>(null)

  // Room editing modal state
  const [editingRoomBookingId, setEditingRoomBookingId] = useState<string | null>(null)
  const [showRoomEditModal, setShowRoomEditModal] = useState(false)

  // Price calculation state
  const [priceBreakdowns, setPriceBreakdowns] = useState<RoomPriceBreakdown[]>([])
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null)
  const [calculatingPrice, setCalculatingPrice] = useState(false)

  // Fetch group data
  const fetchGroup = async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}`)
      if (res.ok) {
        const data = await res.json()
        const g = data.group
        setGroup(g)

        // Populate form
        setGuestName(g.guestName || '')
        setGuestEmail(g.guestEmail || '')
        setGuestPhone(g.guestPhone || '')
        setCheckIn(g.checkIn ? new Date(g.checkIn).toISOString().split('T')[0] : '')
        setCheckOut(g.checkOut ? new Date(g.checkOut).toISOString().split('T')[0] : '')
        setArrivalTime(g.arrivalTime || '')
        setNotes(g.notes || '')
        setTotalAmount(g.totalAmount?.toString() || '')
        setHasCustomHufPrice(g.hasCustomHufPrice || false)
        setCustomHufPrice(g.customHufPrice?.toString() || '')
        setInvoiceSent(g.invoiceSent || false)
        setVendegem(g.vendegem || false)
        setCleaned(g.cleaned || false)
        setPayments(g.payments || [])

        // Set payment summary
        setPaymentSummary(data.paymentSummary)
      }
    } catch (error) {
      console.error('Error fetching group:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroup()
    }
  }, [isOpen, groupId])

  // Calculate prices for the group
  const calculateGroupPrice = async () => {
    if (!group || !group.bookings.length) return

    setCalculatingPrice(true)
    try {
      const res = await fetch('/api/admin/booking-groups/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: group.checkIn,
          checkOut: group.checkOut,
          rooms: group.bookings.map((b) => ({
            roomId: b.roomId,
            guestCount: b.guestCount,
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

  // Calculate prices when group is loaded
  useEffect(() => {
    if (group) {
      calculateGroupPrice()
    }
  }, [group?.id, group?.checkIn, group?.checkOut, JSON.stringify(group?.bookings.map(b => ({ roomId: b.roomId, guestCount: b.guestCount })))])

  // Handle room booking edit - open modal
  const handleEditRoomBooking = (bookingId: string) => {
    setEditingRoomBookingId(bookingId)
    setShowRoomEditModal(true)
  }

  // Handle room edit modal save
  const handleRoomEditSave = () => {
    fetchGroup()
    calculateGroupPrice()
  }

  // Apply calculated price to total
  const applyCalculatedPrice = () => {
    if (calculatedTotal !== null) {
      setTotalAmount(calculatedTotal.toFixed(2))
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGroup(null)
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      setCheckIn('')
      setCheckOut('')
      setArrivalTime('')
      setNotes('')
      setTotalAmount('')
      setHasCustomHufPrice(false)
      setCustomHufPrice('')
      setInvoiceSent(false)
      setVendegem(false)
      setCleaned(false)
      setPayments([])
      setPaymentSummary(null)
      setShowPaymentForm(false)
      // Reset room editing state
      setEditingRoomBookingId(null)
      setShowRoomEditModal(false)
      setPriceBreakdowns([])
      setCalculatedTotal(null)
    }
  }, [isOpen])

  // Handle save
  const handleSave = async () => {
    if (!groupId) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestEmail: guestEmail || null,
          guestPhone: guestPhone || null,
          checkIn,
          checkOut,
          arrivalTime: arrivalTime || null,
          notes: notes || null,
          totalAmount: totalAmount || null,
          hasCustomHufPrice,
          customHufPrice: hasCustomHufPrice ? customHufPrice : null,
          invoiceSent,
          vendegem,
          cleaned,
        }),
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to save changes', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving group:', error)
      setAlertModal({ message: 'Failed to save changes', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    if (!groupId) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        await fetchGroup()
        setShowStatusConfirm(false)
        setPendingStatus(null)
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

  // Handle cancel booking
  const handleCancelGroup = async () => {
    if (!groupId) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (res.ok) {
        await fetchGroup()
        setShowCancelConfirm(false)
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to cancel', type: 'error' })
      }
    } catch (error) {
      console.error('Error cancelling group:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Handle delete group
  const handleDeleteGroup = async () => {
    if (!groupId) return
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to delete group', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting group:', error)
    } finally {
      setShowDeleteGroupConfirm(false)
    }
  }

  // Handle add payment
  const handleAddPayment = async () => {
    if (!groupId) return
    setSavingPayment(true)
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })

      if (res.ok) {
        await fetchGroup()
        setShowPaymentForm(false)
        setPaymentForm({
          amount: '',
          currency: 'EUR',
          method: 'CASH',
          date: new Date().toISOString().split('T')[0],
          note: '',
        })
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

  // Handle delete payment
  const handleDeletePayment = async (paymentId: string) => {
    if (!groupId) return
    try {
      const res = await fetch(`/api/admin/booking-groups/${groupId}/payments?paymentId=${paymentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchGroup()
        setShowDeletePaymentConfirm(false)
        setPendingDeletePaymentId(null)
      } else {
        const error = await res.json()
        setAlertModal({ message: error.error || 'Failed to delete payment', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (!isOpen) return null

  const isCancelled = group?.status === 'CANCELLED'
  const isEditable = !isCancelled

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Group Booking
                </h2>
                <p className="text-sm text-stone-600">
                  {group?.roomCount || 0} rooms • {group?.totalGuests || 0} guests • {group?.nights || 0} nights
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
            ) : group ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Guest & Booking Info */}
                <div className="space-y-6">
                  {/* Status Banner */}
                  {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-red-700 font-medium">This group booking is cancelled</span>
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
                          disabled={!isEditable}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100"
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
                          disabled={!isEditable}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-500 mb-1">Check-out *</label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          disabled={!isEditable}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-stone-500 mb-1">Arrival Time</label>
                      <input
                        type="time"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Source & Notes */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <img src={SOURCE_ICONS[group.source]} alt={group.source} className="w-5 h-5 object-contain" />
                      <span className="text-sm font-medium text-stone-700">{SOURCE_LABELS[group.source]}</span>
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!isEditable}
                        rows={3}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100 resize-none"
                      />
                    </div>
                  </div>

                  {/* Rooms in Group */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-stone-700">Rooms in Group</h3>
                      {calculatingPrice && (
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-stone-500" />
                          Calculating...
                        </span>
                      )}
                    </div>
                    <div className="bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-stone-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-stone-500">Room</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-stone-500">Guests</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-stone-500">Calculated</th>
                            {isEditable && <th className="px-3 py-2 w-10"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {group.bookings.map((booking) => {
                            const priceInfo = priceBreakdowns.find(p => p.roomId === booking.roomId)
                            const hasExtras = booking.additionalPrices && booking.additionalPrices.length > 0

                            return (
                              <tr key={booking.id}>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded">
                                      {booking.room.roomType?.building.name}
                                    </span>
                                    <span className="font-medium text-stone-900">{booking.room.name}</span>
                                    {hasExtras && (
                                      <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded" title={booking.additionalPrices.map(p => p.title).join(', ')}>
                                        +{booking.additionalPrices.length} extra
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center text-stone-600">{booking.guestCount}</td>
                                <td className="px-3 py-2 text-right">
                                  {priceInfo ? (
                                    <span className="text-stone-900">{priceInfo.roomTotal.toFixed(2)} €</span>
                                  ) : (
                                    <span className="text-stone-400">-</span>
                                  )}
                                </td>
                                {isEditable && (
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => handleEditRoomBooking(booking.id)}
                                      className="p-1 text-stone-500 hover:bg-stone-100 rounded cursor-pointer"
                                      title="Edit room details & extras"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                        {priceBreakdowns.length > 0 && (
                          <tfoot className="bg-stone-100">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 text-right text-xs font-medium text-stone-600">
                                Calculated Total:
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-stone-900">
                                {calculatedTotal?.toFixed(2)} €
                              </td>
                              {isEditable && <td></td>}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                    {/* Apply calculated price button */}
                    {isEditable && calculatedTotal !== null && calculatedTotal !== parseFloat(totalAmount || '0') && (
                      <button
                        onClick={applyCalculatedPrice}
                        className="mt-2 w-full px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Apply Calculated Price ({calculatedTotal.toFixed(2)} €)
                      </button>
                    )}
                    <p className="text-xs text-stone-500 mt-2">
                      Prices auto-calculated based on room rates and mandatory fees. Edit rooms to recalculate.
                    </p>
                  </div>
                </div>

                {/* Right Column - Status, Payment & Totals */}
                <div className="space-y-6">
                  {/* Status & Actions */}
                  <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                    <h3 className="text-sm font-medium text-stone-700 mb-3">Status</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[group.status].bg} ${STATUS_COLORS[group.status].text}`}>
                        {STATUS_LABELS[group.status]}
                      </span>
                    </div>
                    {isEditable && getNextStatus(group.status) && (
                      <button
                        onClick={() => {
                          setPendingStatus(getNextStatus(group.status))
                          setShowStatusConfirm(true)
                        }}
                        disabled={updatingStatus}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {updatingStatus ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            {STATUS_ACTION_LABELS[group.status]}
                          </>
                        )}
                      </button>
                    )}
                    {isEditable && group.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full mt-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Cancel Group Booking
                      </button>
                    )}
                  </div>

                  {/* Tracking Checkboxes */}
                  <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                    <h3 className="text-sm font-medium text-stone-700 mb-3">Tracking</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceSent}
                          onChange={(e) => setInvoiceSent(e.target.checked)}
                          disabled={!isEditable}
                          className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-stone-700">Invoice Sent</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vendegem}
                          onChange={(e) => setVendegem(e.target.checked)}
                          disabled={!isEditable}
                          className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-stone-700">Vendégem Registered</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cleaned}
                          onChange={(e) => setCleaned(e.target.checked)}
                          disabled={!isEditable}
                          className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-stone-700">Cleaned</span>
                      </label>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                    <h3 className="text-sm font-medium text-stone-700 mb-3">Pricing</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-stone-500 mb-1">Total Amount (EUR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(e.target.value)}
                          disabled={!isEditable}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-stone-100"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={hasCustomHufPrice}
                            onChange={(e) => setHasCustomHufPrice(e.target.checked)}
                            disabled={!isEditable}
                            className="rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-stone-700">Custom HUF Price</span>
                        </label>
                        {hasCustomHufPrice && (
                          <input
                            type="number"
                            value={customHufPrice}
                            onChange={(e) => setCustomHufPrice(e.target.value)}
                            disabled={!isEditable}
                            placeholder="Enter HUF amount"
                            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50 disabled:bg-stone-100"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payments */}
                  <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-stone-700">Payments</h3>
                      {paymentSummary && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[paymentSummary.paymentStatus as keyof typeof PAYMENT_COLORS]?.bg || 'bg-stone-100'} ${PAYMENT_COLORS[paymentSummary.paymentStatus as keyof typeof PAYMENT_COLORS]?.text || 'text-stone-700'}`}>
                          {PAYMENT_LABELS[paymentSummary.paymentStatus as keyof typeof PAYMENT_LABELS] || paymentSummary.paymentStatus}
                        </span>
                      )}
                    </div>

                    {/* Payment Summary */}
                    {paymentSummary && (
                      <div className="bg-white rounded-lg p-3 mb-3 border border-stone-200">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-stone-600">Total:</span>
                          <span className="font-medium">{paymentSummary.totalAmount?.toFixed(2) || '0.00'} €</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-stone-600">Paid (EUR):</span>
                          <span className="text-green-600">{paymentSummary.paidEur.toFixed(2)} €</span>
                        </div>
                        {paymentSummary.paidHuf > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-stone-600">Paid (HUF):</span>
                            <span className="text-purple-600">{paymentSummary.paidHuf.toLocaleString()} Ft</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-1 border-t border-stone-200">
                          <span className="text-stone-600">Remaining:</span>
                          <span className={paymentSummary.remaining > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                            {paymentSummary.remaining.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Payment List */}
                    {payments.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                        {payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between bg-white rounded p-2 border border-stone-200">
                            <div>
                              <span className="text-sm font-medium">
                                {payment.amount.toFixed(2)} {payment.currency === 'HUF' ? 'Ft' : '€'}
                              </span>
                              <span className="text-xs text-stone-500 ml-2">
                                {PAYMENT_METHOD_LABELS[payment.method]} • {formatDate(payment.date)}
                              </span>
                            </div>
                            {isEditable && (
                              <button
                                onClick={() => {
                                  setPendingDeletePaymentId(payment.id)
                                  setShowDeletePaymentConfirm(true)
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Payment Button/Form */}
                    {isEditable && !showPaymentForm && (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full px-3 py-2 border border-dashed border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer text-sm"
                      >
                        + Add Payment
                      </button>
                    )}

                    {showPaymentForm && (
                      <div className="bg-white rounded-lg p-3 border border-stone-200">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs text-stone-500 mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-500 mb-1">Currency</label>
                            <select
                              value={paymentForm.currency}
                              onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value as PaymentCurrency })}
                              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                            >
                              <option value="EUR">EUR</option>
                              <option value="HUF">HUF</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs text-stone-500 mb-1">Method</label>
                            <select
                              value={paymentForm.method}
                              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                            >
                              <option value="CASH">Cash</option>
                              <option value="TRANSFER">Transfer</option>
                              <option value="CREDIT_CARD">Card</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-stone-500 mb-1">Date</label>
                            <input
                              type="date"
                              value={paymentForm.date}
                              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddPayment}
                            disabled={savingPayment || !paymentForm.amount}
                            className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {savingPayment ? 'Saving...' : 'Add'}
                          </button>
                          <button
                            onClick={() => setShowPaymentForm(false)}
                            className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded text-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone */}
                  {isEditable && (
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h3 className="text-sm font-medium text-red-700 mb-2">Danger Zone</h3>
                      <button
                        onClick={() => setShowDeleteGroupConfirm(true)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-sm"
                      >
                        Delete Entire Group
                      </button>
                      <p className="text-xs text-red-600 mt-2">
                        This will permanently delete the group and all {group.bookings.length} room bookings.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-stone-500">
                Failed to load group data
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
            {isEditable && (
              <button
                onClick={handleSave}
                disabled={saving || !guestName || !checkIn || !checkOut}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Confirmation Modal */}
      {showStatusConfirm && pendingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Confirm Status Change</h3>
            <p className="text-stone-600 mb-4">
              Update status to <strong>{STATUS_LABELS[pendingStatus]}</strong> for all {group?.bookings.length} rooms?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusUpdate(pendingStatus)}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {updatingStatus ? 'Updating...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setShowStatusConfirm(false)
                  setPendingStatus(null)
                }}
                className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Cancel Group Booking</h3>
            <p className="text-stone-600 mb-4">
              Are you sure you want to cancel this entire group booking? This will cancel all {group?.bookings.length} room bookings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelGroup}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {updatingStatus ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 cursor-pointer"
              >
                No, Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Entire Group</h3>
            <p className="text-stone-600 mb-4">
              This action cannot be undone. All {group?.bookings.length} room bookings and payment records will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteGroup}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteGroupConfirm(false)}
                className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      {showDeletePaymentConfirm && pendingDeletePaymentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete Payment</h3>
            <p className="text-stone-600 mb-4">
              Are you sure you want to delete this payment record?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeletePayment(pendingDeletePaymentId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeletePaymentConfirm(false)
                  setPendingDeletePaymentId(null)
                }}
                className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <div className={`flex items-center gap-3 mb-4 ${alertModal.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={alertModal.type === 'error' ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
              </svg>
              <h3 className="text-lg font-semibold">{alertModal.type === 'error' ? 'Error' : 'Info'}</h3>
            </div>
            <p className="text-stone-600 mb-4">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal(null)}
              className="w-full px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Room Edit Modal */}
      <RoomInGroupEditModal
        isOpen={showRoomEditModal}
        onClose={() => {
          setShowRoomEditModal(false)
          setEditingRoomBookingId(null)
        }}
        onSave={handleRoomEditSave}
        groupId={groupId}
        bookingId={editingRoomBookingId}
      />
    </>
  )
}
