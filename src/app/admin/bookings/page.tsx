'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building, AvailableRoom } from './types'
import { GlobalFilters, BookingListView, TimelineView } from './components'

type ViewMode = 'timeline' | 'list'

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [loading, setLoading] = useState(true)

  // Global filters (shared between views)
  const [filterBuildingId, setFilterBuildingId] = useState('')
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('')
  const [filterSource, setFilterSource] = useState('')

  // List-only filters
  const [listFilterStartDate, setListFilterStartDate] = useState('')
  const [listFilterEndDate, setListFilterEndDate] = useState('')
  const [listFilterRoomId, setListFilterRoomId] = useState('')

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
                roomType: roomType.name,
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
  }, [])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  // Handle list filter changes
  const handleListFiltersChange = (filters: { startDate: string; endDate: string; roomId: string }) => {
    setListFilterStartDate(filters.startDate)
    setListFilterEndDate(filters.endDate)
    setListFilterRoomId(filters.roomId)
  }

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
        <div className="flex items-center gap-4 justify-between w-full">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Bookings</h1>
            <p className="text-stone-600 mt-1">
              {viewMode === 'timeline' ? 'Timeline view - drag & drop to reschedule' : 'List view - search & filter bookings'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Timeline
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </span>
            </button>
          </div>
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

      {/* View Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'timeline' ? (
          <TimelineView
            filterBuildingId={filterBuildingId}
            filterRoomTypeId={filterRoomTypeId}
            filterSource={filterSource}
          />
        ) : (
          <BookingListView
            buildings={buildings}
            availableRooms={availableRooms}
            filterBuildingId={filterBuildingId}
            filterRoomTypeId={filterRoomTypeId}
            filterSource={filterSource}
            filterStartDate={listFilterStartDate}
            filterEndDate={listFilterEndDate}
            filterRoomId={listFilterRoomId}
            onFiltersChange={handleListFiltersChange}
          />
        )}
      </div>
    </div>
  )
}
