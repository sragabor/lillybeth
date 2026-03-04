'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useBookingCart } from '@/contexts/BookingCartContext';
import { replacePlaceholders } from '@/contents';

interface AdditionalPriceOption {
  id: string;
  title: Record<string, string>;
  priceEur: number;
  mandatory: boolean;
  perNight: boolean;
  perGuest: boolean;
  origin: 'building' | 'roomType';
  roomTypeId?: string;
}

// Per-room selection: roomTypeId -> roomIndex -> priceId[]
interface PerRoomPriceSelection {
  [roomTypeId: string]: {
    [roomIndex: number]: string[];
  };
}

interface RoomBreakdown {
  roomTypeId: string;
  roomTypeName: Record<string, string> | string;
  accommodationName: Record<string, string> | string;
  quantity: number;
  accommodationTotal: number;
  pricePerRoom: number;
  roomTypeAdditionalPrices: AdditionalPriceOption[];
}

interface PriceCalculation {
  nights: number;
  roomBreakdowns: RoomBreakdown[];
  accommodationTotal: number;
  availableAdditionalPrices: AdditionalPriceOption[];
  selectedAdditionalPrices: {
    id: string;
    title: Record<string, string>;
    priceEur: number;
    quantity: number;
    total: number;
  }[];
  additionalTotal: number;
  grandTotal: number;
}

interface FormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  arrivalTime: string;
  notes: string;
}

interface HouseRuleItem {
  id: string;
  rule: Record<string, string> | string;
}

interface BuildingWithRules {
  id: string;
  name: Record<string, string> | string;
  cancellationPolicy: Record<string, string> | string | null;
  houseRules: HouseRuleItem[];
}

export function BookingPage() {
  const router = useRouter();
  const { t, language } = useFrontendLanguage();
  const { items, dates, totalRooms, removeItem, clearCart, updateGuestCount } = useBookingCart();

  const [formData, setFormData] = useState<FormData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    arrivalTime: '',
    notes: '',
  });
  const [selectedBuildingPriceIds, setSelectedBuildingPriceIds] = useState<string[]>([]);
  const [perRoomSelections, setPerRoomSelections] = useState<PerRoomPriceSelection>({});
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [mandatoryPricesInitialized, setMandatoryPricesInitialized] = useState(false);
  const [buildingRules, setBuildingRules] = useState<BuildingWithRules[]>([]);
  const [activeRuleTab, setActiveRuleTab] = useState<string | null>(null);

  const selectedBuildingPriceIdsRef = useRef<string[]>([]);
  selectedBuildingPriceIdsRef.current = selectedBuildingPriceIds;
  const perRoomSelectionsRef = useRef<PerRoomPriceSelection>({});
  perRoomSelectionsRef.current = perRoomSelections;
  const hasInitiallyLoaded = useRef(false);
  const redirectingToThankYou = useRef(false);

  const getLocalizedText = useCallback(
    (field: Record<string, string> | string | null | undefined): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      return field[language] || field['en'] || Object.values(field)[0] || '';
    },
    [language]
  );

  // Redirect if cart is empty or dates are missing (skip if redirecting to thank-you)
  useEffect(() => {
    if (redirectingToThankYou.current) return;
    if (totalRooms === 0 || !dates.checkIn || !dates.checkOut) {
      router.push('/frontend');
    }
  }, [totalRooms, dates, router]);

  // Fetch building rules for "Good to know" section
  useEffect(() => {
    if (items.length === 0) return;

    const roomTypeIds = [...new Set(items.map((i) => i.roomTypeId))];

    fetch('/api/frontend/buildings/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomTypeIds }),
    })
      .then((r) => r.json())
      .then((data) => {
        const buildings: BuildingWithRules[] = data.buildings || [];
        setBuildingRules(buildings);
        if (buildings.length > 0) {
          setActiveRuleTab(buildings[0].id);
        }
      })
      .catch(() => {});
  }, [items]);

  // Fetch available prices and calculate totals (only on cart/dates change)
  useEffect(() => {
    const calculatePrices = async () => {
      if (!dates.checkIn || !dates.checkOut || items.length === 0) return;

      // Only show full-page loader on initial load; use overlay loader for subsequent recalcs
      if (!hasInitiallyLoaded.current) {
        setLoading(true);
      } else {
        setRecalculating(true);
      }
      setError(null);

      try {
        const response = await fetch('/api/frontend/booking/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: dates.checkIn,
            checkOut: dates.checkOut,
            items: items.map((item) => ({
              roomTypeId: item.roomTypeId,
              quantity: item.quantity,
              guestCounts: item.guestCounts || Array(item.quantity).fill(item.capacity),
            })),
            selectedBuildingPriceIds: selectedBuildingPriceIdsRef.current,
            perRoomSelections: perRoomSelectionsRef.current,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setPriceCalculation(data);
          hasInitiallyLoaded.current = true;

          if (!mandatoryPricesInitialized) {
            const mandatoryBuildingIds = data.availableAdditionalPrices
              .filter((p: AdditionalPriceOption) => p.mandatory && p.origin === 'building')
              .map((p: AdditionalPriceOption) => p.id);
            if (mandatoryBuildingIds.length > 0) {
              setSelectedBuildingPriceIds(mandatoryBuildingIds);
            }

            const newPerRoomSelections: PerRoomPriceSelection = {};
            for (const breakdown of data.roomBreakdowns) {
              const mandatoryRoomPrices = breakdown.roomTypeAdditionalPrices
                ?.filter((p: AdditionalPriceOption) => p.mandatory)
                .map((p: AdditionalPriceOption) => p.id) || [];

              newPerRoomSelections[breakdown.roomTypeId] = {};
              for (let i = 0; i < breakdown.quantity; i++) {
                newPerRoomSelections[breakdown.roomTypeId][i] = [...mandatoryRoomPrices];
              }
            }
            setPerRoomSelections(newPerRoomSelections);
            setMandatoryPricesInitialized(true);
          }
        } else {
          setError(data.error || 'Failed to calculate prices');
        }
      } catch (err) {
        console.error('Error calculating prices:', err);
        setError('Failed to calculate prices');
      } finally {
        setLoading(false);
        setRecalculating(false);
      }
    };

    calculatePrices();
  }, [dates.checkIn, dates.checkOut, items, mandatoryPricesInitialized]);

  // Recalculate when additional price selection changes
  useEffect(() => {
    if (!mandatoryPricesInitialized || !priceCalculation) return;

    const recalculatePrices = async () => {
      if (!dates.checkIn || !dates.checkOut || items.length === 0) return;

      setRecalculating(true);
      try {
        const response = await fetch('/api/frontend/booking/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: dates.checkIn,
            checkOut: dates.checkOut,
            items: items.map((item) => ({
              roomTypeId: item.roomTypeId,
              quantity: item.quantity,
              guestCounts: item.guestCounts || Array(item.quantity).fill(item.capacity),
            })),
            selectedBuildingPriceIds,
            perRoomSelections,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setPriceCalculation(data);
        }
      } catch (err) {
        console.error('Error recalculating prices:', err);
      } finally {
        setRecalculating(false);
      }
    };

    recalculatePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuildingPriceIds, perRoomSelections]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleBuildingPrice = (priceId: string, mandatory: boolean) => {
    if (mandatory) return;
    setSelectedBuildingPriceIds((prev) =>
      prev.includes(priceId) ? prev.filter((id) => id !== priceId) : [...prev, priceId]
    );
  };

  const toggleRoomPrice = (roomTypeId: string, roomIndex: number, priceId: string, mandatory: boolean) => {
    if (mandatory) return;
    setPerRoomSelections((prev) => {
      const updated: PerRoomPriceSelection = {};
      for (const rtId of Object.keys(prev)) {
        updated[rtId] = {};
        for (const rIdxStr of Object.keys(prev[rtId])) {
          const rIdx = Number(rIdxStr);
          updated[rtId][rIdx] = [...prev[rtId][rIdx]];
        }
      }

      if (!updated[roomTypeId]) updated[roomTypeId] = {};
      if (!updated[roomTypeId][roomIndex]) updated[roomTypeId][roomIndex] = [];

      const currentPrices = updated[roomTypeId][roomIndex];
      if (currentPrices.includes(priceId)) {
        updated[roomTypeId][roomIndex] = currentPrices.filter((id) => id !== priceId);
      } else {
        updated[roomTypeId][roomIndex] = [...currentPrices, priceId];
      }

      return updated;
    });
  };

  const isRoomPriceSelected = (roomTypeId: string, roomIndex: number, priceId: string): boolean => {
    return perRoomSelections[roomTypeId]?.[roomIndex]?.includes(priceId) || false;
  };

  const handleRemoveRoom = (roomTypeId: string) => {
    removeItem(roomTypeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/frontend/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone || null,
          arrivalTime: formData.arrivalTime || null,
          notes: formData.notes || null,
          checkIn: dates.checkIn,
          checkOut: dates.checkOut,
          items: items.map((item) => ({
            roomTypeId: item.roomTypeId,
            quantity: item.quantity,
            guestCounts: item.guestCounts || Array(item.quantity).fill(item.capacity),
          })),
          selectedBuildingPriceIds,
          perRoomSelections,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const bookingId = data.bookingId || data.bookingGroupId;
        const totalGuests = items.reduce((sum, item) => {
          const gc = item.guestCounts || Array(item.quantity).fill(item.capacity);
          return sum + gc.reduce((s: number, g: number) => s + g, 0);
        }, 0);
        const allGuestCounts = items.flatMap((item) =>
          item.guestCounts || Array(item.quantity).fill(item.capacity)
        );

        const params = new URLSearchParams({
          id: bookingId,
          type: data.type,
          name: encodeURIComponent(formData.guestName),
          email: encodeURIComponent(formData.guestEmail),
          checkIn: dates.checkIn!,
          checkOut: dates.checkOut!,
          total: data.totalAmount.toString(),
          rooms: totalRooms.toString(),
          guests: totalGuests.toString(),
          guestCounts: allGuestCounts.join(','),
        });

        redirectingToThankYou.current = true;
        clearCart();
        router.push(`/frontend/thank-you?${params}`);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'hu' ? 'hu-HU' : language === 'de' ? 'de-DE' : 'en-US',
      { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
    );
  };

  if (loading || !priceCalculation) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const totalGuests = items.reduce((sum, item) => {
    const guestCounts = item.guestCounts || Array(item.quantity).fill(item.capacity);
    return sum + guestCounts.reduce((s, g) => s + g, 0);
  }, 0);

  // Determine if "Good to know" has any content
  const goodToKnowBuildings = buildingRules.filter(
    (b) => b.cancellationPolicy || b.houseRules.length > 0
  );
  const hasGoodToKnow = goodToKnowBuildings.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/frontend/search"
            className="p-2 -ml-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-birthstone font-semibold text-stone-800">
            {t.booking?.title || 'Complete Your Booking'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Form + Good to Know */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-800 mb-6">
                  {t.booking?.guestInfo || 'Guest Information'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="guestName" className="block text-sm font-medium text-stone-700 mb-2">
                      {t.booking?.guestName || 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      id="guestName"
                      name="guestName"
                      required
                      value={formData.guestName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-shadow"
                      placeholder={t.booking?.guestNamePlaceholder || 'Enter your full name'}
                    />
                  </div>

                  <div>
                    <label htmlFor="guestEmail" className="block text-sm font-medium text-stone-700 mb-2">
                      {t.booking?.email || 'Email Address'} *
                    </label>
                    <input
                      type="email"
                      id="guestEmail"
                      name="guestEmail"
                      required
                      value={formData.guestEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-shadow"
                      placeholder={t.booking?.emailPlaceholder || 'your@email.com'}
                    />
                  </div>

                  <div>
                    <label htmlFor="guestPhone" className="block text-sm font-medium text-stone-700 mb-2">
                      {t.booking?.phone || 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      id="guestPhone"
                      name="guestPhone"
                      value={formData.guestPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-shadow"
                      placeholder={t.booking?.phonePlaceholder || '+36 XX XXX XXXX'}
                    />
                  </div>

                  <div>
                    <label htmlFor="arrivalTime" className="block text-sm font-medium text-stone-700 mb-2">
                      {t.booking?.arrivalTime || 'Expected Arrival Time'}
                    </label>
                    <input
                      type="time"
                      id="arrivalTime"
                      name="arrivalTime"
                      value={formData.arrivalTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-shadow"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-2">
                      {t.booking?.notes || 'Special Requests'}
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 transition-shadow resize-none"
                      placeholder={t.booking?.notesPlaceholder || 'Any special requests or notes...'}
                    />
                  </div>
                </div>
              </div>

              {/* Good to Know Section */}
              {hasGoodToKnow && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-stone-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.booking?.goodToKnow || 'Good to know'}
                  </h2>

                  {/* Tabs if multiple buildings */}
                  {goodToKnowBuildings.length > 1 && (
                    <div className="flex gap-1 mb-6 border-b border-stone-100 overflow-x-auto">
                      {goodToKnowBuildings.map((building) => (
                        <button
                          key={building.id}
                          type="button"
                          onClick={() => setActiveRuleTab(building.id)}
                          className={`pb-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                            activeRuleTab === building.id
                              ? 'border-stone-800 text-stone-800'
                              : 'border-transparent text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          {getLocalizedText(building.name)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  {goodToKnowBuildings
                    .filter((b) => goodToKnowBuildings.length === 1 || b.id === activeRuleTab)
                    .map((building) => (
                      <div key={building.id} className="space-y-6">
                        {/* Booking Conditions */}
                        {building.cancellationPolicy && (
                          <div>
                            <h3 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wide">
                              {t.accommodation?.bookingConditions || 'Booking Conditions'}
                            </h3>
                            <p className="text-sm text-stone-600 leading-relaxed">
                              {getLocalizedText(building.cancellationPolicy)}
                            </p>
                          </div>
                        )}

                        {/* House Rules */}
                        {building.houseRules.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wide">
                              {t.accommodation?.houseRules || 'House Rules'}
                            </h3>
                            <ul className="space-y-2">
                              {building.houseRules.map((rule) => (
                                <li key={rule.id} className="flex items-start gap-2 text-sm text-stone-600">
                                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span>{getLocalizedText(rule.rule)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Submit Button - Mobile */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 bg-amber-400 text-stone-900 rounded-xl font-semibold hover:bg-amber-300 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
                      <span>{t.booking?.processing || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.booking?.completeBooking || 'Complete Booking'}</span>
                      <span className="text-stone-700">• €{priceCalculation.grandTotal}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Booking Summary */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Mobile toggle */}
                <button
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="lg:hidden w-full p-4 flex items-center justify-between text-left border-b border-stone-100"
                >
                  <span className="font-semibold text-stone-800">
                    {t.booking?.summary || 'Booking Summary'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-stone-500 transition-transform ${summaryExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`${summaryExpanded ? 'block' : 'hidden lg:block'}`}>
                  <div className="p-6">
                    <h2 className="hidden lg:block text-lg font-semibold text-stone-800 mb-6">
                      {t.booking?.summary || 'Booking Summary'}
                    </h2>

                    {/* Dates */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                      <div>
                        <p className="text-sm text-stone-500">{t.search.checkIn}</p>
                        <p className="font-medium text-stone-800">{formatDate(dates.checkIn!)}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-px bg-stone-300" />
                        <p className="text-xs text-stone-400 mt-1">
                          {priceCalculation.nights} {priceCalculation.nights === 1 ? t.booking.nightSingular : t.booking.nightsPlural}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-stone-500">{t.search.checkOut}</p>
                        <p className="font-medium text-stone-800">{formatDate(dates.checkOut!)}</p>
                      </div>
                    </div>

                    {/* Per-Room Breakdowns with Additional Prices */}
                    <div className="space-y-4 mb-4 relative">
                      {recalculating && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
                          <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                        </div>
                      )}
                      {priceCalculation.roomBreakdowns.map((breakdown) => {
                        const roomName = getLocalizedText(breakdown.roomTypeName);
                        const accName = getLocalizedText(breakdown.accommodationName);
                        const optionalPrices = breakdown.roomTypeAdditionalPrices?.filter((p) => !p.mandatory) || [];
                        const mandatoryPrices = breakdown.roomTypeAdditionalPrices?.filter((p) => p.mandatory) || [];
                        const hasMultipleRooms = breakdown.quantity > 1;

                        return (
                          <div key={breakdown.roomTypeId} className="bg-stone-50 rounded-xl overflow-hidden">
                            {/* Room Type Header */}
                            <div className="flex items-start justify-between gap-3 p-3 border-b border-stone-100">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-stone-800 truncate">{roomName}</p>
                                <p className="text-sm text-stone-500">{accName}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRoom(breakdown.roomTypeId)}
                                disabled={recalculating}
                                className="p-1 text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Remove room"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>

                            {/* Individual Rooms */}
                            {Array.from({ length: breakdown.quantity }, (_, roomIndex) => {
                              const cartItem = items.find((i) => i.roomTypeId === breakdown.roomTypeId);
                              const currentGuestCount = cartItem?.guestCounts?.[roomIndex] ?? cartItem?.capacity ?? 1;
                              const maxGuests = cartItem?.capacity ?? 1;

                              return (
                                <div key={roomIndex} className="p-3 border-b border-stone-100 last:border-b-0">
                                  <div className="flex items-center justify-between mb-2">
                                    {hasMultipleRooms ? (
                                      <span className="text-sm font-medium text-stone-700">
                                        {t.booking?.room || 'Room'} {roomIndex + 1}
                                      </span>
                                    ) : (
                                      <span className="text-sm font-medium text-stone-700">
                                        {t.booking?.accommodationTotal || 'Accommodation'}
                                      </span>
                                    )}
                                    <span className="text-sm text-stone-600">
                                      €{breakdown.pricePerRoom || 0}
                                    </span>
                                  </div>

                                  {/* Guest Count Stepper */}
                                  <div className="flex items-center justify-between mb-2 p-2 bg-white rounded-lg border border-stone-200">
                                    <div className="flex items-center gap-2 text-sm text-stone-600">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>{t.search?.guests || 'Guests'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateGuestCount(breakdown.roomTypeId, roomIndex, currentGuestCount - 1)}
                                        disabled={currentGuestCount <= 1 || recalculating}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                          currentGuestCount <= 1 || recalculating
                                            ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                        aria-label="Decrease guests"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                      </button>
                                      <span className="w-6 text-center text-sm font-medium text-stone-700">
                                        {currentGuestCount}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateGuestCount(breakdown.roomTypeId, roomIndex, currentGuestCount + 1)}
                                        disabled={currentGuestCount >= maxGuests || recalculating}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                          currentGuestCount >= maxGuests || recalculating
                                            ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                                            : 'bg-stone-800 text-white hover:bg-stone-700'
                                        }`}
                                        aria-label="Increase guests"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Mandatory room prices */}
                                  {mandatoryPrices.map((price) => (
                                    <div
                                      key={price.id}
                                      className="flex items-center justify-between py-1 text-xs text-stone-500"
                                    >
                                      <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {getLocalizedText(price.title)}
                                        <span className="text-stone-400">({t.booking?.mandatory || 'Required'})</span>
                                      </span>
                                      <span>
                                        €{price.priceEur}
                                        {price.perNight && `/${t.booking?.perNight || 'night'}`}
                                      </span>
                                    </div>
                                  ))}

                                  {/* Optional room prices */}
                                  {optionalPrices.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {optionalPrices.map((price) => {
                                        const isSelected = isRoomPriceSelected(breakdown.roomTypeId, roomIndex, price.id);
                                        return (
                                          <button
                                            type="button"
                                            key={price.id}
                                            onClick={() => toggleRoomPrice(breakdown.roomTypeId, roomIndex, price.id, false)}
                                            disabled={recalculating}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                                              recalculating
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-pointer'
                                            } ${
                                              isSelected
                                                ? 'bg-amber-50 border-amber-300'
                                                : 'bg-white border-stone-200 hover:border-stone-300'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                                  isSelected ? 'bg-amber-400 border-amber-400' : 'border-stone-300'
                                                }`}
                                              >
                                                {isSelected && (
                                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                )}
                                              </div>
                                              <span className="text-xs text-stone-700">{getLocalizedText(price.title)}</span>
                                            </div>
                                            <span className="text-xs text-stone-600">
                                              +€{price.priceEur}
                                              {price.perNight && `/${t.booking?.perNight || 'night'}`}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Guest count */}
                    <div className="flex items-center justify-between text-sm pb-4 mb-4 border-b border-stone-100">
                      <span className="text-stone-500">{t.search.guests}</span>
                      <span className="font-medium text-stone-700">
                        {replacePlaceholders(
                          totalGuests === 1 ? t.buildings.capacitySingular : t.buildings.capacity,
                          { count: totalGuests }
                        )}
                      </span>
                    </div>

                    {/* Building-level Additional Prices */}
                    {priceCalculation.availableAdditionalPrices.filter((p) => p.origin === 'building').length > 0 && (
                      <div className="mb-4 relative">
                        {recalculating && (
                          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
                            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-stone-700 mb-3">
                          {t.booking?.additionalServices || 'Additional Services'}
                        </p>
                        <div className="space-y-2">
                          {priceCalculation.availableAdditionalPrices
                            .filter((price) => price.origin === 'building')
                            .map((price) => {
                              const isSelected = selectedBuildingPriceIds.includes(price.id);
                              const priceLabel = getLocalizedText(price.title);

                              return (
                                <button
                                  type="button"
                                  key={price.id}
                                  onClick={() => toggleBuildingPrice(price.id, price.mandatory)}
                                  disabled={price.mandatory || recalculating}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                    price.mandatory
                                      ? 'bg-stone-100 border-stone-200 cursor-default'
                                      : recalculating
                                      ? 'opacity-50 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-amber-50 border-amber-300 cursor-pointer'
                                      : 'bg-white border-stone-200 hover:border-stone-300 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        isSelected || price.mandatory
                                          ? 'bg-amber-400 border-amber-400'
                                          : 'border-stone-300'
                                      }`}
                                    >
                                      {(isSelected || price.mandatory) && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-stone-700">
                                        {priceLabel}
                                      </p>
                                      {price.mandatory && (
                                        <p className="text-xs text-stone-500">{t.booking?.mandatory || 'Required'}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium text-stone-600">
                                    €{price.priceEur}
                                    {price.perNight && <span className="text-xs opacity-70">/{t.booking?.perNight || 'night'}</span>}
                                    {price.perGuest && <span className="text-xs opacity-70">/{t.search.guestSingular}</span>}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="space-y-2 pt-4 border-t border-stone-100 relative">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">{t.booking?.accommodationTotal || 'Accommodation'}</span>
                        <span className={`text-stone-700 transition-opacity ${recalculating ? 'opacity-50' : ''}`}>
                          €{priceCalculation.accommodationTotal}
                        </span>
                      </div>
                      {priceCalculation.additionalTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">{t.booking?.additionalTotal || 'Additional services'}</span>
                          <span className={`text-stone-700 transition-opacity ${recalculating ? 'opacity-50' : ''}`}>
                            €{priceCalculation.additionalTotal}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-stone-200">
                      <span className="text-lg font-semibold text-stone-800">{t.booking?.total || 'Total'}</span>
                      <div className="flex items-center gap-2">
                        {recalculating && (
                          <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                        )}
                        <span className={`text-2xl font-bold text-stone-800 transition-opacity ${recalculating ? 'opacity-50' : ''}`}>
                          €{priceCalculation.grandTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button - Desktop */}
              <div className="hidden lg:block">
                <button
                  type="submit"
                  form="booking-form"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="w-full px-6 py-4 bg-amber-400 text-stone-900 rounded-xl font-semibold hover:bg-amber-300 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
                      <span>{t.booking?.processing || 'Processing...'}</span>
                    </>
                  ) : (
                    <span>{t.booking?.completeBooking || 'Complete Booking'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
