'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building, AvailableRoom } from '../bookings/types'
import { GlobalFilters, TimelineView, CreateBookingGroupModal, BookingModal } from '../bookings/components'
import { getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CalendarPage() {
  const { language } = useLanguage()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [loading, setLoading] = useState(true)

  // Global filters
  const [filterBuildingId, setFilterBuildingId] = useState('')
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('')
  const [filterSource, setFilterSource] = useState('')

  // Booking modals
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch buildings for filters
  const fetchBuildings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bookings/timeline?startDate=2000-01-01&endDate=2000-01-02')
      if (res.ok) {
        const data = await res.json()
        setBuildings(data.buildings || [])

        // Build available rooms list
        const rooms: AvailableRoom[] = []
        data.buildings?.forEach((building: Building) => {
          building.roomTypes?.forEach((roomType) => {
            roomType.rooms?.forEach((room) => {
              rooms.push({
                room,
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
      console.error('Error fetching buildings:', error)
    } finally {
      setLoading(false)
    }
  }, [language])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
        <p className="text-sm text-stone-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Calendar</h1>
          <p className="text-stone-600 mt-1">Timeline view - drag & drop to reschedule</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Booking
          </button>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add Group Booking
          </button>
        </div>
      </div>

      {/* Global Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
        <GlobalFilters
          buildings={buildings}
          selectedBuildingId={filterBuildingId}
          selectedRoomTypeId={filterRoomTypeId}
          selectedSource={filterSource}
          onBuildingChange={setFilterBuildingId}
          onRoomTypeChange={setFilterRoomTypeId}
          onSourceChange={setFilterSource}
        />
      </div>

      {/* Timeline View */}
      <div className="flex-1 min-h-0">
        <TimelineView
          key={refreshKey}
          filterBuildingId={filterBuildingId}
          filterRoomTypeId={filterRoomTypeId}
          filterSource={filterSource}
        />
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSave={() => {
          setShowBookingModal(false)
          setRefreshKey(prev => prev + 1)
        }}
        editingBooking={null}
        availableRooms={availableRooms}
      />

      {/* Create Group Booking Modal */}
      <CreateBookingGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSave={() => {
          setShowCreateGroupModal(false)
          setRefreshKey(prev => prev + 1)
        }}
      />
    </div>
  )
}
