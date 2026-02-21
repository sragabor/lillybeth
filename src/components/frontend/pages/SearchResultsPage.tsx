'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useBookingCart } from '@/contexts/BookingCartContext';
import { BestMatchCard } from '@/components/frontend/search/BestMatchCard';
import { SearchResultRoomTypeCard } from '@/components/frontend/search/SearchResultRoomTypeCard';
import { SearchResultsLoading } from '@/components/frontend/search/SearchResultsLoading';
import { SearchResultsEmpty } from '@/components/frontend/search/SearchResultsEmpty';
import { BookingCart } from '@/components/frontend/accommodation/BookingCart';
import { DateRangePicker } from '@/components/frontend/ui/DateRangePicker';

interface Amenity {
  id: string;
  name: Record<string, string> | string;
  icon: string | null;
}

interface AmenityCategory {
  id: string;
  name: Record<string, string> | string;
  amenities: Amenity[];
}

interface RoomTypeImage {
  id: string;
  url: string;
  alt: string | null;
}

interface RoomType {
  id: string;
  name: Record<string, string> | string;
  description: Record<string, string> | string | null;
  capacity: number;
  minPrice: number | null;
  availableRooms: number;
  images: RoomTypeImage[];
  amenityCategories: AmenityCategory[];
}

interface Accommodation {
  id: string;
  name: Record<string, string> | string;
  slug: string;
  address: string | null;
  image: { url: string; alt: string | null } | null;
  roomTypes: RoomType[];
  amenities: Amenity[];
}

interface CombinationItem {
  roomTypeId: string;
  roomTypeName: Record<string, string> | string;
  capacity: number;
  quantity: number;
  pricePerNight: number | null;
}

interface RoomCombination {
  id: string;
  accommodationId: string;
  accommodationName: Record<string, string> | string;
  accommodationSlug: string;
  items: CombinationItem[];
  totalCapacity: number;
  totalRooms: number;
  totalPricePerNight: number;
  wastedCapacity: number;
}

interface SearchResponse {
  accommodations: Accommodation[];
  combinations: RoomCombination[];
  searchParams: {
    checkIn: string;
    checkOut: string;
    guests: number;
    accommodationId: string | null;
  };
}

export function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useFrontendLanguage();
  const { addOrUpdateItem, clearCart, setDates } = useBookingCart();

  // Parse search params
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');
  const accommodationIdParam = searchParams.get('accommodationId');

  // Check if this is an empty search (no params provided)
  const isEmptySearch = !checkInParam || !checkOutParam || !guestsParam;

  const [loading, setLoading] = useState(!isEmptySearch);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [showModifySearch, setShowModifySearch] = useState(isEmptySearch);
  const [selectedAccommodationIds, setSelectedAccommodationIds] = useState<string[]>([]);

  const [modifyCheckIn, setModifyCheckIn] = useState<Date | null>(
    checkInParam ? new Date(checkInParam) : null
  );
  const [modifyCheckOut, setModifyCheckOut] = useState<Date | null>(
    checkOutParam ? new Date(checkOutParam) : null
  );
  const [modifyGuests, setModifyGuests] = useState(
    guestsParam ? parseInt(guestsParam, 10) : 2
  );

  const getLocalizedText = useCallback(
    (field: Record<string, string> | string | null | undefined): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      return field[language] || field['en'] || Object.values(field)[0] || '';
    },
    [language]
  );

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!checkInParam || !checkOutParam || !guestsParam) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const params = new URLSearchParams({
          checkIn: checkInParam,
          checkOut: checkOutParam,
          guests: guestsParam,
        });

        if (accommodationIdParam) {
          params.set('accommodationId', accommodationIdParam);
        }

        const response = await fetch(`/api/frontend/search?${params}`);
        const data = await response.json();

        if (response.ok) {
          setResults(data);
          // Initialize filter with all accommodations selected
          setSelectedAccommodationIds(data.accommodations.map((a: Accommodation) => a.id));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [checkInParam, checkOutParam, guestsParam, accommodationIdParam]);

  const handleModifySearch = () => {
    if (!modifyCheckIn || !modifyCheckOut) return;

    const params = new URLSearchParams({
      checkIn: modifyCheckIn.toISOString().split('T')[0],
      checkOut: modifyCheckOut.toISOString().split('T')[0],
      guests: modifyGuests.toString(),
    });

    if (accommodationIdParam) {
      params.set('accommodationId', accommodationIdParam);
    }

    router.push(`/frontend/search?${params}`);
    setShowModifySearch(false);
  };

  const handleSelectBestMatch = (combination: RoomCombination) => {
    clearCart();

    // Set dates in cart
    if (checkInParam && checkOutParam) {
      setDates(checkInParam, checkOutParam);
    }

    const accommodationName = getLocalizedText(combination.accommodationName);

    for (const item of combination.items) {
      const roomTypeName = getLocalizedText(item.roomTypeName);

      addOrUpdateItem({
        roomTypeId: item.roomTypeId,
        roomTypeName: roomTypeName,
        accommodationId: combination.accommodationId,
        accommodationName: accommodationName,
        quantity: item.quantity,
        pricePerNight: item.pricePerNight,
        capacity: item.capacity,
      });
    }
  };

  const handleToggleAccommodation = (accommodationId: string) => {
    if (!results) return;
    const allIds = results.accommodations.map((a) => a.id);

    setSelectedAccommodationIds((prev) => {
      const isCurrentlySelected = prev.includes(accommodationId);
      const currentlyAllSelected = allIds.every((id) => prev.includes(id));

      if (currentlyAllSelected) {
        // If all are selected, clicking one means "show only this one"
        return [accommodationId];
      } else if (isCurrentlySelected) {
        // If this one is selected and not all are selected, deselect it
        const newSelection = prev.filter((id) => id !== accommodationId);
        // If this would leave none selected, select all instead
        return newSelection.length === 0 ? allIds : newSelection;
      } else {
        // Add to selection
        return [...prev, accommodationId];
      }
    });
  };

  const handleToggleAll = () => {
    if (!results) return;
    const allIds = results.accommodations.map((a) => a.id);
    // Always select all when clicking "Any accommodation"
    setSelectedAccommodationIds(allIds);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'hu' ? 'hu-HU' : language === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const guests = guestsParam ? parseInt(guestsParam, 10) : 0;
  const bestMatch = results?.combinations?.[0] || null;
  const hasResults = results && results.accommodations.length > 0;

  // Filter accommodations based on selection
  const filteredAccommodations = results?.accommodations.filter(
    (a) => selectedAccommodationIds.includes(a.id)
  ) || [];

  // Check if all accommodations are selected
  const allSelected = results
    ? results.accommodations.length > 0 && results.accommodations.every((a) => selectedAccommodationIds.includes(a.id))
    : false;

  return (
    <div className="min-h-screen bg-stone-50 pb-32 pt-18">
      {/* Search Summary Header */}
      <div className="bg-stone-800 border-b border-stone-700 sticky top-18 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/frontend"
                className="p-2 -ml-2 text-stone-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {checkInParam && checkOutParam && (
                <div className="text-sm">
                  <span className="font-medium text-white">
                    {formatDate(checkInParam)} — {formatDate(checkOutParam)}
                  </span>
                  <span className="text-stone-400 mx-2">•</span>
                  <span className="text-stone-300">
                    {guests} {guests === 1 ? t.search.guestSingular : t.search.guestPlural}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModifySearch(!showModifySearch)}
              className="px-4 py-2 text-sm font-medium text-white bg-stone-700 rounded-lg hover:bg-stone-600 transition-colors"
            >
              {t.search.modifySearch || 'Modify Search'}
            </button>
          </div>

          {/* Modify Search Panel */}
          {showModifySearch && (
            <div className="mt-4 pt-4 border-t border-stone-700 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <DateRangePicker
                    checkIn={modifyCheckIn}
                    checkOut={modifyCheckOut}
                    onCheckInChange={setModifyCheckIn}
                    onCheckOutChange={setModifyCheckOut}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                    {t.search.guests}
                  </label>
                  <select
                    value={modifyGuests}
                    onChange={(e) => setModifyGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 cursor-pointer"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? t.search.guestSingular : t.search.guestPlural}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleModifySearch}
                  disabled={!modifyCheckIn || !modifyCheckOut}
                  className="px-6 py-3 bg-amber-400 text-stone-900 rounded-xl font-semibold hover:bg-amber-300 transition-colors disabled:bg-stone-400 disabled:text-stone-600 disabled:cursor-not-allowed"
                >
                  {t.search.searchButton}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <SearchResultsLoading />
        ) : isEmptySearch ? (
          <SearchResultsEmpty guests={guests} isEmptySearch={true} />
        ) : !hasResults ? (
          <SearchResultsEmpty guests={guests} isEmptySearch={false} />
        ) : (
          <div className="space-y-8">
            {/* Best Match Card */}
            {bestMatch && (
              <BestMatchCard
                combination={bestMatch}
                getLocalizedText={getLocalizedText}
                onSelect={() => handleSelectBestMatch(bestMatch)}
              />
            )}

            {/* Accommodation Filter */}
            {results.accommodations.length > 1 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-sm font-medium text-stone-700">
                    {t.search.filterByAccommodation || 'Filter by accommodation'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Any Accommodation Badge */}
                  <button
                    onClick={handleToggleAll}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      allSelected
                        ? 'bg-stone-800 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {t.search.anyAccommodation || 'Any accommodation'}
                  </button>

                  {/* Individual Accommodation Badges */}
                  {results.accommodations.map((accommodation) => {
                    const isSelected = selectedAccommodationIds.includes(accommodation.id);
                    const isOnlyOneSelected = selectedAccommodationIds.length === 1 && isSelected;
                    const name = getLocalizedText(accommodation.name);

                    return (
                      <button
                        key={accommodation.id}
                        onClick={() => handleToggleAccommodation(accommodation.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                          isSelected && !allSelected
                            ? 'bg-stone-800 text-white shadow-md'
                            : isSelected && allSelected
                            ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {accommodation.image && (
                          <Image
                            src={accommodation.image.url}
                            alt={accommodation.image.alt || name}
                            width={20}
                            height={20}
                            className="rounded-full object-cover w-5 h-5"
                          />
                        )}
                        {name}
                        <span className="text-xs opacity-70">
                          ({accommodation.roomTypes.length})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room Types by Accommodation - Grouped Cards */}
            {filteredAccommodations.map((accommodation) => (
              <div
                key={accommodation.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
              >
                {/* Accommodation Header */}
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100">
                  {accommodation.image ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      <Image
                        src={accommodation.image.url}
                        alt={accommodation.image.alt || getLocalizedText(accommodation.name)}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-serif font-semibold text-stone-800 truncate">
                      {getLocalizedText(accommodation.name)}
                    </h2>
                    {accommodation.address && (
                      <p className="text-sm text-stone-500 mt-0.5 flex items-center gap-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{accommodation.address}</span>
                      </p>
                    )}
                    <p className="text-sm text-stone-500 mt-1">
                      {accommodation.roomTypes.length} {accommodation.roomTypes.length === 1 ? 'room type' : 'room types'} available
                    </p>
                  </div>
                  <Link
                    href={`/frontend/accommodation/${accommodation.slug}`}
                    className="hidden sm:flex items-center gap-1 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    {t.buildings.viewDetails}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Room Types List */}
                <div className="divide-y divide-stone-100">
                  {accommodation.roomTypes.map((roomType, index) => (
                    <div key={roomType.id} className="p-5">
                      <SearchResultRoomTypeCard
                        roomType={roomType}
                        accommodationId={accommodation.id}
                        accommodationName={getLocalizedText(accommodation.name)}
                        accommodationAmenities={accommodation.amenities}
                        getLocalizedText={getLocalizedText}
                        index={index}
                        checkIn={checkInParam}
                        checkOut={checkOutParam}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* No results after filtering */}
            {filteredAccommodations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-500">
                  {t.search.selectAccommodation || 'Select at least one accommodation to see results'}
                </p>
                <button
                  onClick={handleToggleAll}
                  className="mt-4 px-6 py-2 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 transition-colors"
                >
                  {t.search.showAll || 'Show all'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Cart */}
      <BookingCart />
    </div>
  );
}
