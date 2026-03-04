'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingCart } from '@/contexts/BookingCartContext';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { replacePlaceholders } from '@/contents';

export function BookingCart() {
  const router = useRouter();
  const { items, dates, totalRooms, removeItem, clearCart } = useBookingCart();
  const { t } = useFrontendLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if cart is empty
  if (totalRooms === 0) {
    return null;
  }

  // Calculate total price per night
  const totalPricePerNight = items.reduce((sum, item) => {
    if (item.pricePerNight) {
      return sum + item.pricePerNight * item.quantity;
    }
    return sum;
  }, 0);

  // Calculate actual total guests from guestCounts
  const totalGuests = items.reduce((sum, item) => {
    const guestCounts = item.guestCounts || Array(item.quantity).fill(item.capacity);
    return sum + guestCounts.reduce((s, g) => s + g, 0);
  }, 0);

  // Check if we have dates set
  const hasDates = dates.checkIn && dates.checkOut;

  const handleBookNow = () => {
    if (hasDates) {
      router.push('/frontend/booking');
    }
  };

  // Format total guests with "max" prefix using buildings.capacity pattern
  const totalGuestsLabel = replacePlaceholders(
    totalGuests === 1 ? t.buildings.capacitySingular : t.buildings.capacity,
    { count: totalGuests }
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto px-4 pb-4 pointer-events-auto">
        <div className="bg-stone-800 text-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Expanded view with item details */}
          {isExpanded && (
            <div className="max-h-[60vh] overflow-y-auto border-b border-stone-700">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{t.accommodation.roomTypes}</h3>
                  <button
                    onClick={clearCart}
                    className="text-sm text-stone-400 hover:text-white transition-colors"
                  >
                    {t.booking.clearCart}
                  </button>
                </div>

                {/* Date info */}
                {hasDates && (
                  <div className="flex items-center gap-2 text-sm text-stone-400 pb-3 border-b border-stone-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(dates.checkIn!).toLocaleDateString()} — {new Date(dates.checkOut!).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {items.map((item) => {
                  const itemGuestCounts = item.guestCounts || Array(item.quantity).fill(item.capacity);
                  const itemTotalGuests = itemGuestCounts.reduce((s, g) => s + g, 0);
                  return (
                    <div
                      key={item.roomTypeId}
                      className="flex items-center justify-between py-3 border-b border-stone-700 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.roomTypeName}</p>
                        <p className="text-sm text-stone-400">
                          {item.accommodationName} • {t.common.max} {itemTotalGuests} {itemTotalGuests === 1 ? t.search.guestSingular : t.search.guestPlural}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="font-semibold">x{item.quantity}</p>
                          {item.pricePerNight && (
                            <p className="text-sm text-stone-400">
                              €{item.pricePerNight * item.quantity}/{t.booking.perNight}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.roomTypeId)}
                          className="p-2 text-stone-400 hover:text-white transition-colors"
                          aria-label="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main bar */}
          <div className="p-4 flex items-center justify-between gap-4">
            {/* Left: Summary info */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 text-left flex-1 min-w-0"
            >
              {/* Room count badge */}
              <div className="flex items-center justify-center w-10 h-10 bg-white text-stone-800 rounded-full font-bold text-lg flex-shrink-0">
                {totalRooms}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {totalRooms} {totalRooms === 1 ? t.booking.roomSingular : t.booking.roomsPlural} {t.booking.selected}
                </p>
                <p className="text-sm text-stone-400 truncate">
                  {totalGuestsLabel}
                  {totalPricePerNight > 0 && ` • €${totalPricePerNight}/${t.booking.perNight}`}
                </p>
              </div>

              {/* Expand/collapse indicator */}
              <svg
                className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {/* Right: CTA Button */}
            <button
              onClick={handleBookNow}
              disabled={!hasDates}
              className="px-6 py-3 bg-amber-400 text-stone-900 font-semibold rounded-xl hover:bg-amber-300 transition-colors flex-shrink-0 disabled:bg-stone-600 disabled:text-stone-400 disabled:cursor-not-allowed"
            >
              {hasDates ? t.booking.guestBookingDetails : t.booking.selectDates}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
