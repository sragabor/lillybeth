'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications, AdminNotification } from '@/contexts/NotificationsContext'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (secs < 60) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateRange(checkIn: string, checkOut: string): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return `${fmt(checkIn)} → ${fmt(checkOut)}`
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: AdminNotification
  onClick: (n: AdminNotification) => void
}) {
  const isGroup = notification.type === 'NEW_WEBSITE_GROUP_BOOKING'
  const unread = !notification.isRead

  return (
    <button
      onClick={() => onClick(notification)}
      className={`w-full text-left px-4 py-3 border-b border-stone-100 last:border-0 transition-colors hover:brightness-95 ${
        unread ? 'bg-amber-50' : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
            unread ? 'bg-amber-100' : 'bg-stone-100'
          }`}
        >
          {isGroup ? (
            <svg
              className={`w-4 h-4 ${unread ? 'text-amber-600' : 'text-stone-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          ) : (
            <svg
              className={`w-4 h-4 ${unread ? 'text-amber-600' : 'text-stone-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p
              className={`text-sm font-medium truncate ${
                unread ? 'text-stone-900' : 'text-stone-600'
              }`}
            >
              {notification.title}
            </p>
            {unread && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
          <p className="text-sm text-stone-700 truncate mt-0.5">
            {notification.payload.guestName}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {formatDateRange(notification.payload.checkIn, notification.payload.checkOut)}
            {' · '}
            {notification.payload.guestCount}{' '}
            {notification.payload.guestCount === 1 ? 'guest' : 'guests'}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  )
}

interface NotificationBellProps {
  /** Which side the dropdown opens toward. Use 'left' in sidebar, 'right' in header. */
  align?: 'left' | 'right'
}

export function NotificationBell({ align = 'left' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleNotificationClick = useCallback(
    async (notification: AdminNotification) => {
      setOpen(false)
      if (!notification.isRead) {
        await markAsRead(notification.id)
      }
      if (notification.bookingId) {
        router.push(`/admin/bookings?openBookingId=${notification.bookingId}`)
      } else if (notification.groupBookingId) {
        router.push(`/admin/bookings?openGroupId=${notification.groupBookingId}`)
      }
    },
    [markAsRead, router]
  )

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge with pulse */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full bg-amber-500 text-white font-bold leading-none px-1 min-w-4 h-4 text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-[60] overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-stone-500">{unreadCount} unread</span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg
                  className="w-8 h-8 text-stone-300 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm text-stone-400">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onClick={handleNotificationClick} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
