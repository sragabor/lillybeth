// Shared types for booking views

export interface Building {
  id: string
  name: string
  roomTypes: RoomType[]
}

export interface RoomType {
  id: string
  name: string
  rooms: Room[]
}

export interface Room {
  id: string
  name: string
  isActive: boolean
  roomType?: {
    id: string
    name: string
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
export type PaymentStatus = 'PENDING' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'REFUNDED'

export interface Booking {
  id: string
  source: BookingSource
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes: string | null
  totalAmount: number | null
  roomId: string
  room: Room
  additionalPrices: BookingAdditionalPrice[]
  nights?: number
}

export interface AvailableRoom {
  room: Room
  building: string
  roomType: string
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
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes: string
  totalAmount: string
}

// Constants
export const SOURCE_COLORS = {
  MANUAL: { bg: 'bg-stone-100', border: 'border-stone-400', text: 'text-stone-800', badge: 'bg-stone-400' },
  WEBSITE: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', badge: 'bg-yellow-400' },
  BOOKING_COM: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', badge: 'bg-blue-400' },
  SZALLAS_HU: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-400' },
  AIRBNB: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', badge: 'bg-red-400' },
}

export const SOURCE_LABELS = {
  MANUAL: 'Manual',
  WEBSITE: 'Website',
  BOOKING_COM: 'Booking.com',
  SZALLAS_HU: 'Szállás.hu',
  AIRBNB: 'Airbnb',
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

export const PAYMENT_LABELS = {
  PENDING: 'Pending',
  DEPOSIT_PAID: 'Deposit Paid',
  FULLY_PAID: 'Fully Paid',
  REFUNDED: 'Refunded',
}

export const PAYMENT_COLORS = {
  PENDING: { bg: 'bg-stone-100', text: 'text-stone-700' },
  DEPOSIT_PAID: { bg: 'bg-amber-100', text: 'text-amber-700' },
  FULLY_PAID: { bg: 'bg-green-100', text: 'text-green-700' },
  REFUNDED: { bg: 'bg-red-100', text: 'text-red-700' },
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
  status: 'INCOMING',
  paymentStatus: 'PENDING',
  notes: '',
  totalAmount: '',
}
