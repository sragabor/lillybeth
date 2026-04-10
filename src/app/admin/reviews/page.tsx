'use client'

import { useState, useEffect } from 'react'

type ReviewLanguage = 'EN' | 'HU' | 'DE'

interface BuildingOption {
  id: string
  name: string
}

interface Review {
  id: string
  name: string
  title: string | null
  text: string
  country: string
  language: ReviewLanguage
  rating: number
  createdAt: string
  buildings: { building: BuildingOption }[]
}

const LANGUAGE_LABELS: Record<ReviewLanguage, string> = {
  EN: 'English',
  HU: 'Hungarian',
  DE: 'German',
}

const LANGUAGE_COLORS: Record<ReviewLanguage, string> = {
  EN: 'bg-sky-100 text-sky-700',
  HU: 'bg-red-100 text-red-700',
  DE: 'bg-amber-100 text-amber-700',
}

const emptyForm = {
  name: '',
  title: '',
  text: '',
  country: '',
  language: 'EN' as ReviewLanguage,
  rating: 10,
  buildingIds: [] as string[],
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [buildings, setBuildings] = useState<BuildingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()
      if (res.ok) setReviews(data.reviews)
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/admin/buildings')
      const data = await res.json()
      if (res.ok) setBuildings(data.buildings)
    } catch (err) {
      console.error('Error fetching buildings:', err)
    }
  }

  useEffect(() => {
    fetchReviews()
    fetchBuildings()
  }, [])

  const openCreateModal = () => {
    setEditingReview(null)
    setFormData(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEditModal = (review: Review) => {
    setEditingReview(review)
    setFormData({
      name: review.name,
      title: review.title ?? '',
      text: review.text,
      country: review.country,
      language: review.language,
      rating: review.rating,
      buildingIds: review.buildings.map((b) => b.building.id),
    })
    setError('')
    setShowModal(true)
  }

  const toggleBuilding = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      buildingIds: prev.buildingIds.includes(id)
        ? prev.buildingIds.filter((b) => b !== id)
        : [...prev.buildingIds, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editingReview
        ? `/api/admin/reviews/${editingReview.id}`
        : '/api/admin/reviews'
      const method = editingReview ? 'PUT' : 'POST'

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
      fetchReviews()
    } catch (err) {
      console.error('Error saving review:', err)
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      if (res.ok) fetchReviews()
    } catch (err) {
      console.error('Error deleting review:', err)
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
          <h1 className="text-2xl font-bold text-stone-900">Reviews</h1>
          <p className="text-stone-600 mt-1">Manage guest reviews for your buildings</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Review
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>No reviews yet</p>
            <p className="text-sm mt-1">Add your first guest review</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Guest</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Review</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Buildings</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Rating</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Language</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-900">{review.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{review.country}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm text-stone-700 line-clamp-2">{review.text}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {review.buildings.length === 0 ? (
                        <span className="text-xs text-stone-400">—</span>
                      ) : (
                        review.buildings.map((b) => (
                          <span
                            key={b.building.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700"
                          >
                            {b.building.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-amber-600">{review.rating}
                      <span className="text-stone-400 font-normal">/10</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${LANGUAGE_COLORS[review.language]}`}>
                      {LANGUAGE_LABELS[review.language]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(review)}
                        className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              {editingReview ? 'Edit Review' : 'Add Review'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Guest name"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. Hungary"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Title <span className="text-stone-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Perfect stay!"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value as ReviewLanguage })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
                >
                  <option value="EN">English</option>
                  <option value="HU">Hungarian</option>
                  <option value="DE">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Rating: <span className="text-amber-600 font-semibold">{formData.rating}/10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Review Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Guest review text..."
                  rows={4}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Buildings</label>
                {buildings.length === 0 ? (
                  <p className="text-sm text-stone-500">No buildings available</p>
                ) : (
                  <div className="space-y-2 border border-stone-200 rounded-lg p-3">
                    {buildings.map((building) => (
                      <label key={building.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.buildingIds.includes(building.id)}
                          onChange={() => toggleBuilding(building.id)}
                          className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-sm text-stone-700">{building.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
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
                  {saving ? 'Saving...' : editingReview ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
