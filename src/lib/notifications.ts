import { prisma } from './prisma'

export type NotificationType =
  | 'NEW_WEBSITE_BOOKING'
  | 'NEW_WEBSITE_GROUP_BOOKING'

export interface NotificationPayload {
  guestName: string
  guestEmail?: string | null
  guestPhone?: string | null
  checkIn: string
  checkOut: string
  guestCount: number
  source: string
  totalAmount?: number | null
}

const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  NEW_WEBSITE_BOOKING: 'New Website Booking',
  NEW_WEBSITE_GROUP_BOOKING: 'New Website Group Booking',
}

export async function createNotification(params: {
  type: NotificationType
  bookingId?: string
  groupBookingId?: string
  payload: NotificationPayload
}) {
  return prisma.adminNotification.create({
    data: {
      type: params.type,
      title: NOTIFICATION_TITLES[params.type],
      bookingId: params.bookingId ?? null,
      groupBookingId: params.groupBookingId ?? null,
      payload: params.payload as object,
    },
  })
}
