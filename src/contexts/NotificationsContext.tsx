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

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const es = new EventSource('/api/admin/notifications/stream')
    eventSourceRef.current = es

    es.onopen = () => {
      setSseConnected(true)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setNotifications(data.notifications)
      setLoading(false)
    }

    es.onerror = () => {
      setSseConnected(false)
      es.close()
      eventSourceRef.current = null
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = setTimeout(connectSSE, 10000)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    connectSSE()

    return () => {
      eventSourceRef.current?.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [fetchNotifications, connectSSE])

  // Polling fallback when SSE is disconnected
  useEffect(() => {
    if (sseConnected) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }
    pollingIntervalRef.current = setInterval(fetchNotifications, 30000)
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [sseConnected, fetchNotifications])

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
