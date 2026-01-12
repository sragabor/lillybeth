'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { LocalizedText } from '@/lib/i18n'
import { createEmptyLocalizedText, getLocalizedText } from '@/lib/i18n/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { MultilingualRichText } from '@/components/ui/MultilingualRichText'
import { MultilingualTextInput } from '@/components/ui/MultilingualTextInput'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { ImageGallery, GalleryImage } from '@/components/ui/ImageGallery'
import { UPLOAD_CONFIG } from '@/lib/upload/config'

interface Amenity {
  id: string
  name: LocalizedText
}

interface AmenityCategory {
  id: string
  name: LocalizedText
  amenities: Amenity[]
}

interface AdditionalPrice {
  id: string
  title: LocalizedText
  priceEur: number
  mandatory: boolean
  perNight: boolean
}

interface RoomTypeImage {
  id: string
  url: string
  filename: string
  order: number
}

interface Room {
  id: string
  name: string
  isActive: boolean
}

interface RoomType {
  id: string
  name: LocalizedText
  capacity: number
  description: LocalizedText | null
  building: {
    id: string
    name: string
  }
  images: RoomTypeImage[]
  amenityCategories: AmenityCategory[]
  additionalPrices: AdditionalPrice[]
  rooms: Room[]
}

type TabType = 'general' | 'images' | 'amenities' | 'prices' | 'rooms'

export default function RoomTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { language } = useLanguage()
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState<LocalizedText>(createEmptyLocalizedText())
  const [capacity, setCapacity] = useState('2')
  const [description, setDescription] = useState<LocalizedText>(createEmptyLocalizedText())
  const [amenityCategories, setAmenityCategories] = useState<{ name: LocalizedText; amenities: { name: LocalizedText }[] }[]>([])
  const [additionalPrices, setAdditionalPrices] = useState<{ title: LocalizedText; priceEur: number; mandatory: boolean; perNight: boolean }[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])

  // Room modal
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    fetchRoomType()
  }, [id])

  const fetchRoomType = async () => {
    try {
      const res = await fetch(`/api/admin/room-types/${id}`)
      const data = await res.json()
      if (data.roomType) {
        const rt = data.roomType as RoomType
        setRoomType(rt)
        setName(rt.name || createEmptyLocalizedText())
        setCapacity(rt.capacity?.toString() || '2')
        setDescription(rt.description || createEmptyLocalizedText())
        setAmenityCategories(rt.amenityCategories.map((c) => ({
          name: c.name || createEmptyLocalizedText(),
          amenities: c.amenities.map((a) => ({ name: a.name || createEmptyLocalizedText() })),
        })))
        setAdditionalPrices(rt.additionalPrices.map((p) => ({
          title: p.title || createEmptyLocalizedText(),
          priceEur: p.priceEur,
          mandatory: p.mandatory,
          perNight: p.perNight,
        })))
        setImages(rt.images.map((i) => ({
          id: i.id,
          url: i.url,
          filename: i.filename,
          order: i.order,
        })))
      }
    } catch {
      setError('Failed to fetch room type')
    } finally {
      setLoading(false)
    }
  }

  const saveGeneral = async () => {
    setSaving(true)
    setError(null)
    try {
      await fetch(`/api/admin/room-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          capacity,
          description,
        }),
      })
      await fetchRoomType()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveAmenities = async () => {
    setSaving(true)
    setError(null)
    try {
      const validCategories = amenityCategories.filter(c => getLocalizedText(c.name, 'en'))
      await fetch(`/api/admin/room-types/${id}/amenity-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: validCategories }),
      })
      await fetchRoomType()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const savePrices = async () => {
    setSaving(true)
    setError(null)
    try {
      const validPrices = additionalPrices.filter(p => getLocalizedText(p.title, 'en'))
      await fetch(`/api/admin/room-types/${id}/additional-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: validPrices }),
      })
      await fetchRoomType()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveImages = async () => {
    setSaving(true)
    setError(null)
    try {
      await fetch(`/api/admin/room-types/${id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img, index) => ({
            id: img.id,
            url: img.url,
            filename: img.filename,
            order: index,
          })),
        }),
      })
      await fetchRoomType()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (image: { url: string; filename: string }) => {
    const newImage: GalleryImage = {
      id: `temp-${Date.now()}`,
      url: image.url,
      filename: image.filename,
      order: images.length,
    }
    setImages([...images, newImage])
  }

  const handleImageReorder = (reorderedImages: GalleryImage[]) => {
    setImages(reorderedImages)
  }

  const handleImageDelete = async (imageId: string) => {
    setImages(images.filter(img => img.id !== imageId))
  }

  const createRoom = async () => {
    try {
      await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: id,
          name: newRoomName,
        }),
      })
      setShowRoomModal(false)
      setNewRoomName('')
      await fetchRoomType()
    } catch {
      setError('Failed to create room')
    }
  }

  const toggleRoomActive = async (roomId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      await fetchRoomType()
    } catch {
      setError('Failed to update room')
    }
  }

  const deleteRoom = async (roomId: string) => {
    try {
      await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      await fetchRoomType()
    } catch {
      setError('Failed to delete room')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-stone-500">Loading...</div>
  }

  if (!roomType) {
    return <div className="text-center py-12 text-stone-500">Room type not found</div>
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'images', label: 'Images' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'prices', label: 'Additional Prices' },
    { key: 'rooms', label: 'Rooms' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/admin/buildings/${roomType.building.id}`}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">{getLocalizedText(roomType.name, language)}</h1>
          <p className="text-stone-500">{roomType.building.name} • {roomType.capacity} adults</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-stone-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <MultilingualTextInput
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Room type name"
              required
            />
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Capacity (adults)</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <MultilingualRichText
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Rich description of the room type"
              rows={6}
            />
            <button
              onClick={saveGeneral}
              disabled={saving}
              className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500 mb-4">
              Upload images for this room type. Drag to reorder (first image is the cover).
            </p>

            <ImageUploader
              onUpload={handleImageUpload}
              onError={(err) => setError(err)}
              directory={UPLOAD_CONFIG.paths.roomTypes}
              prefix={`room-type-${id}`}
            />

            <ImageGallery
              images={images}
              onReorder={handleImageReorder}
              onDelete={handleImageDelete}
            />

            {images.length > 0 && (
              <button
                onClick={saveImages}
                disabled={saving}
                className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Images'}
              </button>
            )}
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500 mb-4">Organize amenities into categories. Names support multiple languages.</p>
            {amenityCategories.map((cat, catIndex) => (
              <div key={catIndex} className="border border-stone-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <MultilingualTextInput
                      label="Category Name"
                      value={cat.name}
                      onChange={(value) => {
                        const newCats = [...amenityCategories]
                        newCats[catIndex].name = value
                        setAmenityCategories(newCats)
                      }}
                      placeholder="e.g., Bathroom"
                    />
                  </div>
                  <button
                    onClick={() => setAmenityCategories(amenityCategories.filter((_, i) => i !== catIndex))}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-lg mt-6"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="pl-4 space-y-3">
                  <p className="text-xs font-medium text-stone-500 uppercase">Amenities</p>
                  {cat.amenities.map((amenity, amenityIndex) => (
                    <div key={amenityIndex} className="flex items-start gap-2">
                      <div className="flex-1">
                        <MultilingualTextInput
                          label=""
                          value={amenity.name}
                          onChange={(value) => {
                            const newCats = [...amenityCategories]
                            newCats[catIndex].amenities[amenityIndex].name = value
                            setAmenityCategories(newCats)
                          }}
                          placeholder="Amenity name"
                          compact
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newCats = [...amenityCategories]
                          newCats[catIndex].amenities = newCats[catIndex].amenities.filter((_, i) => i !== amenityIndex)
                          setAmenityCategories(newCats)
                        }}
                        className="p-1 text-stone-400 hover:text-red-500 rounded mt-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newCats = [...amenityCategories]
                      newCats[catIndex].amenities.push({ name: createEmptyLocalizedText() })
                      setAmenityCategories(newCats)
                    }}
                    className="text-amber-600 hover:text-amber-700 text-sm"
                  >
                    + Add Amenity
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setAmenityCategories([...amenityCategories, { name: createEmptyLocalizedText(), amenities: [] }])}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              + Add Category
            </button>
            <div className="pt-4">
              <button
                onClick={saveAmenities}
                disabled={saving}
                className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Amenities'}
              </button>
            </div>
          </div>
        )}

        {/* Additional Prices Tab */}
        {activeTab === 'prices' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500 mb-4">Extra charges specific to this room type. Titles support multiple languages.</p>
            {additionalPrices.map((price, index) => (
              <div key={index} className="border border-stone-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-stone-600">Price {index + 1}</span>
                  <button
                    onClick={() => setAdditionalPrices(additionalPrices.filter((_, i) => i !== index))}
                    className="p-1 text-stone-400 hover:text-red-500 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <MultilingualTextInput
                    label="Title"
                    value={price.title}
                    onChange={(value) => {
                      const newPrices = [...additionalPrices]
                      newPrices[index].title = value
                      setAdditionalPrices(newPrices)
                    }}
                    placeholder="e.g., Extra bed"
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={price.priceEur}
                        onChange={(e) => {
                          const newPrices = [...additionalPrices]
                          newPrices[index].priceEur = parseFloat(e.target.value) || 0
                          setAdditionalPrices(newPrices)
                        }}
                        className="w-24 px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
                        placeholder="0"
                      />
                      <span className="text-stone-500 text-sm">EUR</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={price.mandatory}
                        onChange={(e) => {
                          const newPrices = [...additionalPrices]
                          newPrices[index].mandatory = e.target.checked
                          setAdditionalPrices(newPrices)
                        }}
                        className="rounded border-stone-300"
                      />
                      Mandatory
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={price.perNight}
                        onChange={(e) => {
                          const newPrices = [...additionalPrices]
                          newPrices[index].perNight = e.target.checked
                          setAdditionalPrices(newPrices)
                        }}
                        className="rounded border-stone-300"
                      />
                      Per Night
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setAdditionalPrices([...additionalPrices, { title: createEmptyLocalizedText(), priceEur: 0, mandatory: false, perNight: false }])}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              + Add Price
            </button>
            <div className="pt-4">
              <button
                onClick={savePrices}
                disabled={saving}
                className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Prices'}
              </button>
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">Manage individual rooms of this type</p>
              <button
                onClick={() => setShowRoomModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Room
              </button>
            </div>

            {roomType.rooms.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No rooms yet. Create your first one.
              </div>
            ) : (
              <div className="space-y-2">
                {roomType.rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between py-3 px-4 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-stone-300'}`} />
                      <span className="text-sm text-stone-700">{room.name}</span>
                      {!room.isActive && <span className="text-xs text-stone-400">(Inactive)</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleRoomActive(room.id, room.isActive)}
                        className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-white"
                        title={room.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {room.isActive ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteRoom(room.id)}
                        className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Add Room</h3>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Room Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                placeholder="e.g., Room 101"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowRoomModal(false); setNewRoomName('') }}
                className="flex-1 px-4 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                disabled={!newRoomName.trim()}
                className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
