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

interface HouseRule {
  id: string
  key: LocalizedText
  value: LocalizedText
}

interface AdditionalPrice {
  id: string
  title: LocalizedText
  priceEur: number
  mandatory: boolean
  perNight: boolean
}

interface BuildingImage {
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
  name: string
  capacity: number
  images: BuildingImage[]
  rooms: Room[]
}

interface Building {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  description: LocalizedText | null
  cancellationPolicy: LocalizedText | null
  paymentMethods: LocalizedText | null
  depositInfo: LocalizedText | null
  images: BuildingImage[]
  houseRules: HouseRule[]
  amenityCategories: AmenityCategory[]
  additionalPrices: AdditionalPrice[]
  roomTypes: RoomType[]
}

type TabType = 'general' | 'images' | 'rules' | 'amenities' | 'conditions' | 'prices' | 'room-types'

export default function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { language } = useLanguage()
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [generalForm, setGeneralForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
  })
  const [description, setDescription] = useState<LocalizedText>(createEmptyLocalizedText())
  const [cancellationPolicy, setCancellationPolicy] = useState<LocalizedText>(createEmptyLocalizedText())
  const [paymentMethods, setPaymentMethods] = useState<LocalizedText>(createEmptyLocalizedText())
  const [depositInfo, setDepositInfo] = useState<LocalizedText>(createEmptyLocalizedText())

  const [houseRules, setHouseRules] = useState<{ key: LocalizedText; value: LocalizedText }[]>([])
  const [amenityCategories, setAmenityCategories] = useState<{ name: LocalizedText; amenities: { name: LocalizedText }[] }[]>([])
  const [additionalPrices, setAdditionalPrices] = useState<{ title: LocalizedText; priceEur: number; mandatory: boolean; perNight: boolean }[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])

  // Room type modal
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false)
  const [newRoomTypeName, setNewRoomTypeName] = useState('')
  const [newRoomTypeCapacity, setNewRoomTypeCapacity] = useState('2')

  // Room modal
  const [showRoomModal, setShowRoomModal] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    fetchBuilding()
  }, [id])

  const fetchBuilding = async () => {
    try {
      const res = await fetch(`/api/admin/buildings/${id}`)
      const data = await res.json()
      if (data.building) {
        const b = data.building as Building
        setBuilding(b)
        setGeneralForm({
          name: b.name || '',
          address: b.address || '',
          latitude: b.latitude?.toString() || '',
          longitude: b.longitude?.toString() || '',
        })
        setDescription(b.description || createEmptyLocalizedText())
        setCancellationPolicy(b.cancellationPolicy || createEmptyLocalizedText())
        setPaymentMethods(b.paymentMethods || createEmptyLocalizedText())
        setDepositInfo(b.depositInfo || createEmptyLocalizedText())
        setHouseRules(b.houseRules.map((r) => ({
          key: r.key || createEmptyLocalizedText(),
          value: r.value || createEmptyLocalizedText(),
        })))
        setAmenityCategories(b.amenityCategories.map((c) => ({
          name: c.name || createEmptyLocalizedText(),
          amenities: c.amenities.map((a) => ({ name: a.name || createEmptyLocalizedText() })),
        })))
        setAdditionalPrices(b.additionalPrices.map((p) => ({
          title: p.title || createEmptyLocalizedText(),
          priceEur: p.priceEur,
          mandatory: p.mandatory,
          perNight: p.perNight,
        })))
        setImages(b.images.map((i) => ({
          id: i.id,
          url: i.url,
          filename: i.filename,
          order: i.order,
        })))
      }
    } catch {
      setError('Failed to fetch building')
    } finally {
      setLoading(false)
    }
  }

  const saveGeneral = async () => {
    setSaving(true)
    setError(null)
    try {
      await fetch(`/api/admin/buildings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generalForm,
          description,
          cancellationPolicy,
          paymentMethods,
          depositInfo,
        }),
      })
      await fetchBuilding()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveHouseRules = async () => {
    setSaving(true)
    setError(null)
    try {
      const validRules = houseRules.filter(r =>
        getLocalizedText(r.key, 'en') || getLocalizedText(r.value, 'en')
      )
      await fetch(`/api/admin/buildings/${id}/house-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: validRules }),
      })
      await fetchBuilding()
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
      await fetch(`/api/admin/buildings/${id}/amenity-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: validCategories }),
      })
      await fetchBuilding()
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
      await fetch(`/api/admin/buildings/${id}/additional-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: validPrices }),
      })
      await fetchBuilding()
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
      await fetch(`/api/admin/buildings/${id}/images`, {
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
      await fetchBuilding()
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

  const createRoomType = async () => {
    try {
      await fetch('/api/admin/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: id,
          name: newRoomTypeName,
          capacity: newRoomTypeCapacity,
        }),
      })
      setShowRoomTypeModal(false)
      setNewRoomTypeName('')
      setNewRoomTypeCapacity('2')
      await fetchBuilding()
    } catch {
      setError('Failed to create room type')
    }
  }

  const createRoom = async (roomTypeId: string) => {
    try {
      await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId,
          name: newRoomName,
        }),
      })
      setShowRoomModal(null)
      setNewRoomName('')
      await fetchBuilding()
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
      await fetchBuilding()
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
      await fetchBuilding()
    } catch {
      setError('Failed to delete room')
    }
  }

  const deleteRoomType = async (roomTypeId: string) => {
    try {
      await fetch(`/api/admin/room-types/${roomTypeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      await fetchBuilding()
    } catch {
      setError('Failed to delete room type')
    }
  }

  const duplicateRoomType = async (roomTypeId: string) => {
    try {
      await fetch(`/api/admin/room-types/${roomTypeId}/duplicate`, {
        method: 'POST',
      })
      await fetchBuilding()
    } catch {
      setError('Failed to duplicate room type')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-stone-500">Loading...</div>
  }

  if (!building) {
    return <div className="text-center py-12 text-stone-500">Building not found</div>
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'images', label: 'Images' },
    { key: 'rules', label: 'House Rules' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'conditions', label: 'Booking Conditions' },
    { key: 'prices', label: 'Additional Prices' },
    { key: 'room-types', label: 'Room Types' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/buildings"
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">{building.name}</h1>
          <p className="text-stone-500">{building.address || 'No address set'}</p>
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
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Name</label>
              <input
                type="text"
                value={generalForm.name}
                onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Address</label>
              <input
                type="text"
                value={generalForm.address}
                onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                placeholder="Enter address for Google Maps"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Latitude</label>
                <input
                  type="text"
                  value={generalForm.latitude}
                  onChange={(e) => setGeneralForm({ ...generalForm, latitude: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Longitude</label>
                <input
                  type="text"
                  value={generalForm.longitude}
                  onChange={(e) => setGeneralForm({ ...generalForm, longitude: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>
            <MultilingualRichText
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Rich description of the property"
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
              Upload images for this building. Drag to reorder (first image is the cover).
            </p>

            <ImageUploader
              onUpload={handleImageUpload}
              onError={(err) => setError(err)}
              directory={UPLOAD_CONFIG.paths.buildings}
              prefix={`building-${id}`}
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

        {/* House Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500 mb-4">
              Key-value pairs like &quot;Check-in&quot; → &quot;14:00&quot;. Each field supports multiple languages.
            </p>
            {houseRules.map((rule, index) => (
              <div key={index} className="border border-stone-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-stone-600">Rule {index + 1}</span>
                  <button
                    onClick={() => setHouseRules(houseRules.filter((_, i) => i !== index))}
                    className="p-1 text-stone-400 hover:text-red-500 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <MultilingualTextInput
                    label="Key"
                    value={rule.key}
                    onChange={(value) => {
                      const newRules = [...houseRules]
                      newRules[index].key = value
                      setHouseRules(newRules)
                    }}
                    placeholder="e.g., Check-out"
                  />
                  <MultilingualTextInput
                    label="Value"
                    value={rule.value}
                    onChange={(value) => {
                      const newRules = [...houseRules]
                      newRules[index].value = value
                      setHouseRules(newRules)
                    }}
                    placeholder="e.g., 10:00"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setHouseRules([...houseRules, { key: createEmptyLocalizedText(), value: createEmptyLocalizedText() }])}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              + Add Rule
            </button>
            <div className="pt-4">
              <button
                onClick={saveHouseRules}
                disabled={saving}
                className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
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
                      placeholder="e.g., Kitchen"
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

        {/* Booking Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className="space-y-6">
            <MultilingualRichText
              label="Cancellation Policy"
              value={cancellationPolicy}
              onChange={setCancellationPolicy}
              placeholder="Describe your cancellation policy"
              rows={4}
            />
            <MultilingualRichText
              label="Payment Methods"
              value={paymentMethods}
              onChange={setPaymentMethods}
              placeholder="List accepted payment methods"
              rows={4}
            />
            <MultilingualRichText
              label="Deposit Information"
              value={depositInfo}
              onChange={setDepositInfo}
              placeholder="Describe deposit requirements"
              rows={4}
            />
            <button
              onClick={saveGeneral}
              disabled={saving}
              className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Conditions'}
            </button>
          </div>
        )}

        {/* Additional Prices Tab */}
        {activeTab === 'prices' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500 mb-4">Extra charges like cleaning fees, pet fees, etc. Titles support multiple languages.</p>
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
                    placeholder="e.g., Cleaning fee"
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

        {/* Room Types Tab */}
        {activeTab === 'room-types' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">Manage room types and their rooms</p>
              <button
                onClick={() => setShowRoomTypeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Room Type
              </button>
            </div>

            {building.roomTypes.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No room types yet. Create your first one.
              </div>
            ) : (
              <div className="space-y-4">
                {building.roomTypes.map((roomType) => (
                  <div key={roomType.id} className="border border-stone-200 rounded-xl overflow-hidden">
                    <div className="bg-stone-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-stone-200 rounded-lg overflow-hidden">
                          {roomType.images[0] ? (
                            <img src={roomType.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-stone-800">{roomType.name}</h4>
                          <p className="text-sm text-stone-500">{roomType.capacity} adults • {roomType.rooms.length} rooms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/room-types/${roomType.id}`}
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Edit Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => duplicateRoomType(roomType.id)}
                          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteRoomType(roomType.id)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-stone-600">Rooms</span>
                        <button
                          onClick={() => setShowRoomModal(roomType.id)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                        >
                          + Add Room
                        </button>
                      </div>
                      {roomType.rooms.length === 0 ? (
                        <p className="text-sm text-stone-400">No rooms yet</p>
                      ) : (
                        <div className="space-y-2">
                          {roomType.rooms.map((room) => (
                            <div key={room.id} className="flex items-center justify-between py-2 px-3 bg-stone-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-stone-300'}`} />
                                <span className="text-sm text-stone-700">{room.name}</span>
                                {!room.isActive && <span className="text-xs text-stone-400">(Inactive)</span>}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleRoomActive(room.id, room.isActive)}
                                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded"
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
                                  className="p-1.5 text-stone-400 hover:text-red-500 rounded"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Room Type Modal */}
      {showRoomTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Add Room Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newRoomTypeName}
                  onChange={(e) => setNewRoomTypeName(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="e.g., Deluxe Double Room"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Capacity (adults)</label>
                <input
                  type="number"
                  value={newRoomTypeCapacity}
                  onChange={(e) => setNewRoomTypeCapacity(e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRoomTypeModal(false)}
                className="flex-1 px-4 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createRoomType}
                disabled={!newRoomTypeName.trim()}
                className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => { setShowRoomModal(null); setNewRoomName('') }}
                className="flex-1 px-4 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createRoom(showRoomModal)}
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
