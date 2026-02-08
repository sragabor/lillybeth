'use client'

import { useState, useEffect } from 'react'
import BookingModal from '../bookings/components/BookingModal'
import { CreateBookingGroupModal } from '../bookings/components'
import { AvailableRoom } from '../bookings/types'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { LocalizedText } from '@/lib/i18n'

interface Building {
  id: string
  name: string
  roomTypes: {
    id: string
    name: LocalizedText
    capacity: number
    rooms: {
      id: string
      name: string
      isActive: boolean
    }[]
  }[]
}

interface SpecialDay {
  id: string
  name: string
  startDate: string
  endDate: string
}

export default function DashboardActions() {
  const { language } = useLanguage()

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])

  // Group Booking modal state
  const [showGroupBookingModal, setShowGroupBookingModal] = useState(false)

  // Special Day modal state
  const [showSpecialDayModal, setShowSpecialDayModal] = useState(false)
  const [specialDayForm, setSpecialDayForm] = useState({ name: '', startDate: '', endDate: '' })
  const [specialDaySaving, setSpecialDaySaving] = useState(false)
  const [specialDayError, setSpecialDayError] = useState('')

  // Fetch available rooms for booking modal
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/admin/bookings/timeline?startDate=' +
          new Date().toISOString().split('T')[0] +
          '&endDate=' +
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        )
        const data = await res.json()

        if (data.buildings) {
          const rooms: AvailableRoom[] = []
          data.buildings.forEach((building: Building) => {
            building.roomTypes?.forEach((roomType) => {
              roomType.rooms?.forEach((room) => {
                rooms.push({
                  room: {
                    id: room.id,
                    name: room.name,
                    isActive: room.isActive,
                  },
                  building: building.name,
                  roomType: getLocalizedText(roomType.name, language),
                  capacity: roomType.capacity,
                })
              })
            })
          })
          setAvailableRooms(rooms)
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
      }
    }

    fetchRooms()
  }, [language])

  // Handle Special Day form submit
  const handleSpecialDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSpecialDaySaving(true)
    setSpecialDayError('')

    try {
      const res = await fetch('/api/admin/special-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specialDayForm),
      })

      const data = await res.json()

      if (!res.ok) {
        setSpecialDayError(data.error || 'Failed to create special day')
        return
      }

      setShowSpecialDayModal(false)
      setSpecialDayForm({ name: '', startDate: '', endDate: '' })
      // Refresh the page to update the calendar
      window.location.reload()
    } catch (error) {
      console.error('Error creating special day:', error)
      setSpecialDayError('Failed to create special day')
    } finally {
      setSpecialDaySaving(false)
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowBookingModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-stone-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-left">
            <span className="font-medium block">Create Booking</span>
            <span className="text-sm text-stone-400">Add a new reservation</span>
          </div>
        </button>

        <button
          onClick={() => setShowGroupBookingModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-left">
            <span className="font-medium block">Group Booking</span>
            <span className="text-sm text-indigo-200">Multiple rooms, one guest</span>
          </div>
        </button>

        <button
          onClick={() => {
            setSpecialDayForm({ name: '', startDate: '', endDate: '' })
            setSpecialDayError('')
            setShowSpecialDayModal(true)
          }}
          className="flex items-center gap-3 px-6 py-4 bg-white border border-stone-200 text-stone-800 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-colors cursor-pointer shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-left">
            <span className="font-medium block">Create Special Day</span>
            <span className="text-sm text-stone-500">Add holiday or event</span>
          </div>
        </button>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSave={() => {
          setShowBookingModal(false)
          window.location.reload()
        }}
        editingBooking={null}
        availableRooms={availableRooms}
      />

      {/* Group Booking Modal */}
      <CreateBookingGroupModal
        isOpen={showGroupBookingModal}
        onClose={() => setShowGroupBookingModal(false)}
        onSave={() => {
          setShowGroupBookingModal(false)
          window.location.reload()
        }}
      />

      {/* Special Day Modal */}
      {showSpecialDayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              Add Special Day
            </h2>

            <form onSubmit={handleSpecialDaySubmit} className="space-y-4">
              {specialDayError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {specialDayError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={specialDayForm.name}
                  onChange={(e) => setSpecialDayForm({ ...specialDayForm, name: e.target.value })}
                  placeholder="e.g., Christmas, Easter, New Year"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={specialDayForm.startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setSpecialDayForm({
                        ...specialDayForm,
                        startDate: newStartDate,
                        endDate: !specialDayForm.endDate || specialDayForm.endDate < newStartDate
                          ? newStartDate
                          : specialDayForm.endDate
                      })
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={specialDayForm.endDate}
                    onChange={(e) => setSpecialDayForm({ ...specialDayForm, endDate: e.target.value })}
                    min={specialDayForm.startDate}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1">Same as start for single day</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSpecialDayModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={specialDaySaving}
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {specialDaySaving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
