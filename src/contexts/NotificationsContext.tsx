'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'

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

export interface AdminNotification {
  id: string
  type: string
  title: string
  bookingId: string | null
  groupBookingId: string | null
  payload: NotificationPayload
  isRead: boolean
  readAt: string | null
  createdAt: string
}

interface NotificationsContextType {
  notifications: AdminNotification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

const POLL_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    pollingIntervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS)

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
      }
    } catch {
      // ignore
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markAsRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
