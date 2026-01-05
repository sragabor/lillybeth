'use client'

import { Building, BookingSource, SOURCE_LABELS } from '../types'

interface GlobalFiltersProps {
  buildings: Building[]
  selectedBuildingId: string
  selectedRoomTypeId: string
  selectedSource: string
  onBuildingChange: (buildingId: string) => void
  onRoomTypeChange: (roomTypeId: string) => void
  onSourceChange: (source: string) => void
}

export default function GlobalFilters({
  buildings,
  selectedBuildingId,
  selectedRoomTypeId,
  selectedSource,
  onBuildingChange,
  onRoomTypeChange,
  onSourceChange,
}: GlobalFiltersProps) {
  // Get room types for selected building
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId)
  const roomTypes = selectedBuilding?.roomTypes || []

  // Handle building change - reset room type if building changes
  const handleBuildingChange = (buildingId: string) => {
    onBuildingChange(buildingId)
    if (buildingId !== selectedBuildingId) {
      onRoomTypeChange('')
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Building Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-stone-600">Building:</label>
        <select
          value={selectedBuildingId}
          onChange={(e) => handleBuildingChange(e.target.value)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
        >
          <option value="">All Buildings</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>

      {/* Room Type Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-stone-600">Room Type:</label>
        <select
          value={selectedRoomTypeId}
          onChange={(e) => onRoomTypeChange(e.target.value)}
          disabled={!selectedBuildingId}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer disabled:bg-stone-100 disabled:cursor-not-allowed"
        >
          <option value="">All Room Types</option>
          {roomTypes.map((roomType) => (
            <option key={roomType.id} value={roomType.id}>
              {roomType.name}
            </option>
          ))}
        </select>
      </div>

      {/* Source Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-stone-600">Source:</label>
        <select
          value={selectedSource}
          onChange={(e) => onSourceChange(e.target.value)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
        >
          <option value="">All Sources</option>
          {(Object.keys(SOURCE_LABELS) as BookingSource[]).map((source) => (
            <option key={source} value={source}>
              {SOURCE_LABELS[source]}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {(selectedBuildingId || selectedRoomTypeId || selectedSource) && (
        <button
          onClick={() => {
            onBuildingChange('')
            onRoomTypeChange('')
            onSourceChange('')
          }}
          className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}
