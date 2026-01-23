'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building } from '../bookings/types'
import { GlobalFilters, TimelineView } from '../bookings/components'

export default function CalendarPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)

  // Global filters
  const [filterBuildingId, setFilterBuildingId] = useState('')
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('')
  const [filterSource, setFilterSource] = useState('')

  // Fetch buildings for filters
  const fetchBuildings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bookings/timeline?startDate=2000-01-01&endDate=2000-01-02')
      if (res.ok) {
        const data = await res.json()
        setBuildings(data.buildings || [])
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
          filterBuildingId={filterBuildingId}
          filterRoomTypeId={filterRoomTypeId}
          filterSource={filterSource}
        />
      </div>
    </div>
  )
}
