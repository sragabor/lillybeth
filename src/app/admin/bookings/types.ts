// Shared types for booking views

import { LocalizedText } from '@/lib/i18n'

export interface Building {
  id: string
  name: string
  roomTypes: RoomType[]
}

export interface RoomType {
  id: string
  name: LocalizedText
  capacity: number
  rooms: Room[]
}

export interface Room {
  id: string
  name: string
  isActive: boolean
  roomType?: {
    id: string
    name: LocalizedText
    building: {
      id: string
      name: string
    }
  }
}

export interface BookingAdditionalPrice {
  id: string
  title: string
  priceEur: number
  quantity: number
}

export type BookingSource = 'MANUAL' | 'WEBSITE' | 'BOOKING_COM' | 'SZALLAS_HU' | 'AIRBNB'
export type BookingStatus = 'INCOMING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CREDIT_CARD'
export type PaymentCurrency = 'EUR' | 'HUF'

export interface Payment {
  id: string
  amount: number
  currency: PaymentCurrency
  method: PaymentMethod
  date: string
  note: string | null
  bookingId: string
  createdAt: string
}

export interface Booking {
  id: string
  source: BookingSource
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string
  arrivalTime: string | null
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes: string | null
  totalAmount: number | null
  hasCustomHufPrice: boolean
  customHufPrice: number | null
  roomId: string
  room: Room
  additionalPrices: BookingAdditionalPrice[]
  payments: Payment[]
  nights?: number
  // Status tracking checkboxes
  invoiceSent: boolean
  vendegem: boolean
  cleaned: boolean
  // Group relation (for grouped bookings)
  groupId?: string | null
}

// Room booking within a group
export interface GroupRoomBooking {
  id: string
  roomId: string
  guestCount: number
  totalAmount: number | null
  room: Room
  additionalPrices: BookingAdditionalPrice[]
}

// Unified list item - can be either standalone booking or a group
export interface ListItem {
  type: 'standalone' | 'group'
  id: string
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string
  arrivalTime: string | null
  source: BookingSource
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes: string | null
  totalAmount: number | null
  hasCustomHufPrice: boolean
  customHufPrice: number | null
  invoiceSent: boolean
  vendegem: boolean
  cleaned: boolean
  nights: number
  roomCount: number
  // For standalone bookings
  room?: Room
  additionalPrices?: BookingAdditionalPrice[]
  // For groups - nested room bookings
  bookings?: GroupRoomBooking[]
}

export interface AvailableRoom {
  room: Room
  building: string
  roomType: string
  capacity: number
}

export interface PriceBreakdown {
  nights: number
  accommodationTotal: number
  availableAdditionalPrices: {
    id: string
    title: string
    priceEur: number
    mandatory: boolean
    perNight: boolean
    perGuest: boolean
    origin: 'building' | 'roomType'
  }[]
  additionalPrices: {
    id: string
    title: string
    priceEur: number
    quantity: number
    total: number
    origin: 'building' | 'roomType'
  }[]
  additionalTotal: number
  grandTotal: number
}

export interface BookingFormData {
  roomId: string
  source: BookingSource
  guestName: string
  guestEmail: string
  guestPhone: string
  guestCount: string
  checkIn: string
  checkOut: string
  arrivalTime: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes: string
  totalAmount: string
}

// Constants
export const SOURCE_COLORS = {
  MANUAL: { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-800', badge: 'bg-emerald-500' },
  WEBSITE: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800', badge: 'bg-yellow-500' },
  BOOKING_COM: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', badge: 'bg-blue-500' },
  SZALLAS_HU: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800', badge: 'bg-purple-500' },
  AIRBNB: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', badge: 'bg-red-500' },
}

export const SOURCE_LABELS = {
  MANUAL: 'Direct',
  WEBSITE: 'Website',
  BOOKING_COM: 'Booking.com',
  SZALLAS_HU: 'Szállás.hu',
  AIRBNB: 'Airbnb',
}

export const SOURCE_ICONS = {
  MANUAL: '/icons/MANUAL.png',
  WEBSITE: '/icons/WEBSITE.webp',
  BOOKING_COM: '/icons/BOOKING_COM.svg',
  SZALLAS_HU: '/icons/SZALLAS_HU.webp',
  AIRBNB: '/icons/AIRBNB.webp',
}

export const STATUS_COLORS = {
  INCOMING: { bg: 'bg-stone-100', text: 'text-stone-700', opacity: 'opacity-60' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', opacity: 'opacity-100' },
  CHECKED_IN: { bg: 'bg-green-100', text: 'text-green-700', opacity: 'opacity-100' },
  CHECKED_OUT: { bg: 'bg-emerald-100', text: 'text-emerald-700', opacity: 'opacity-100' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', opacity: 'opacity-30' },
}

export const STATUS_LABELS = {
  INCOMING: 'Incoming',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  CANCELLED: 'Cancelled',
}

export const STATUS_ICONS = {
  INCOMING: '○',
  CONFIRMED: '●',
  CHECKED_IN: '→',
  CHECKED_OUT: '←',
  CANCELLED: '✕',
}

// Status flow order (Cancelled is not part of the main flow)
export const STATUS_FLOW: BookingStatus[] = ['INCOMING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']

// Get next status in the flow (returns null if at end or cancelled)
export function getNextStatus(currentStatus: BookingStatus): BookingStatus | null {
  if (currentStatus === 'CANCELLED') return null
  const currentIndex = STATUS_FLOW.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[currentIndex + 1]
}

// Get action label for advancing to next status
export const STATUS_ACTION_LABELS: Record<BookingStatus, string> = {
  INCOMING: 'Confirm Booking',
  CONFIRMED: 'Check In Guest',
  CHECKED_IN: 'Check Out Guest',
  CHECKED_OUT: '', // No next action
  CANCELLED: '', // No next action
}

export const PAYMENT_LABELS = {
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially Paid',
  FULLY_PAID: 'Fully Paid',
  REFUNDED: 'Refunded',
}

export const PAYMENT_COLORS = {
  PENDING: { bg: 'bg-stone-100', text: 'text-stone-700' },
  PARTIALLY_PAID: { bg: 'bg-amber-100', text: 'text-amber-700' },
  FULLY_PAID: { bg: 'bg-green-100', text: 'text-green-700' },
  REFUNDED: { bg: 'bg-red-100', text: 'text-red-700' },
}

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
}

// Default form values
export const DEFAULT_BOOKING_FORM: BookingFormData = {
  roomId: '',
  source: 'MANUAL',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestCount: '1',
  checkIn: '',
  checkOut: '',
  arrivalTime: '',
  status: 'INCOMING',
  paymentStatus: 'PENDING',
  notes: '',
  totalAmount: '',
}
