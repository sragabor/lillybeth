'use client'

import { useState, useEffect } from 'react'

interface SpecialDay {
  id: string
  name: string
  startDate: string
  endDate: string
}

export default function SpecialDaysPage() {
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDay, setEditingDay] = useState<SpecialDay | null>(null)
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchSpecialDays = async () => {
    try {
      const res = await fetch('/api/admin/special-days')
      const data = await res.json()
      if (res.ok) {
        setSpecialDays(data.specialDays)
      }
    } catch (error) {
      console.error('Error fetching special days:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecialDays()
  }, [])

  const openCreateModal = () => {
    setEditingDay(null)
    setFormData({ name: '', startDate: '', endDate: '' })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (day: SpecialDay) => {
    setEditingDay(day)
    setFormData({
      name: day.name,
      startDate: day.startDate.split('T')[0],
      endDate: day.endDate.split('T')[0],
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editingDay
        ? `/api/admin/special-days/${editingDay.id}`
        : '/api/admin/special-days'
      const method = editingDay ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }

      setShowModal(false)
      fetchSpecialDays()
    } catch (error) {
      console.error('Error saving special day:', error)
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this special day?')) return

    try {
      const res = await fetch(`/api/admin/special-days/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchSpecialDays()
      }
    } catch (error) {
      console.error('Error deleting special day:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Special Days</h1>
          <p className="text-stone-600 mt-1">
            Manage holidays and special events that will be highlighted in the calendar
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Special Day
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {specialDays.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p>No special days configured</p>
            <p className="text-sm mt-1">Add holidays like Christmas, Easter, or custom events</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {specialDays.map((day) => (
                <tr key={day.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-900">
                          {new Date(day.startDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {day.startDate !== day.endDate && (
                          <span className="text-xs text-stone-500">
                            → {new Date(day.endDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-stone-700">{day.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(day)}
                        className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(day.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              {editingDay ? 'Edit Special Day' : 'Add Special Day'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setFormData({
                        ...formData,
                        startDate: newStartDate,
                        // Auto-set endDate to startDate if empty or before new startDate
                        endDate: !formData.endDate || formData.endDate < newStartDate
                          ? newStartDate
                          : formData.endDate
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
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1">Same as start date for single day</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingDay ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
