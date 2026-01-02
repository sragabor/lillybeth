'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Room {
  id: string
  name: string
  isActive: boolean
}

interface RoomType {
  id: string
  name: string
  rooms: Room[]
}

interface BuildingImage {
  id: string
  url: string
}

interface Building {
  id: string
  name: string
  address: string | null
  images: BuildingImage[]
  roomTypes: RoomType[]
  createdAt: string
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBuildingName, setNewBuildingName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchBuildings()
  }, [])

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/admin/buildings')
      const data = await res.json()
      setBuildings(data.buildings || [])
    } catch {
      console.error('Failed to fetch buildings')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newBuildingName.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/admin/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBuildingName }),
      })

      if (res.ok) {
        setShowCreateModal(false)
        setNewBuildingName('')
        fetchBuildings()
      }
    } catch {
      console.error('Failed to create building')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/buildings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })

      if (res.ok) {
        setDeleteConfirm(null)
        fetchBuildings()
      }
    } catch {
      console.error('Failed to delete building')
    }
  }

  const getRoomCount = (building: Building) => {
    return building.roomTypes.reduce((acc, rt) => acc + rt.rooms.length, 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Buildings</h1>
          <p className="text-stone-500 mt-1">Manage your properties</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Building
        </button>
      </div>

      {/* Buildings Grid */}
      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading...</div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-stone-500 mb-4">No buildings yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Create your first building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <div
              key={building.id}
              className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="aspect-video bg-stone-100 relative">
                {building.images[0] ? (
                  <img
                    src={building.images[0].url}
                    alt={building.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-stone-800 text-lg mb-1">{building.name}</h3>
                {building.address && (
                  <p className="text-stone-500 text-sm mb-3 truncate">{building.address}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {building.roomTypes.length} types
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {getRoomCount(building)} rooms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/buildings/${building.id}`}
                    className="flex-1 py-2 px-4 text-center text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm({ id: building.id, name: building.name })}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-semibold text-stone-800">Create Building</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">Building Name</label>
              <input
                type="text"
                value={newBuildingName}
                onChange={(e) => setNewBuildingName(e.target.value)}
                placeholder="e.g., Villa Lillybeth"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                autoFocus
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newBuildingName.trim()}
                  className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">Delete Building?</h3>
              <p className="text-stone-500 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will also delete all room types and rooms.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
