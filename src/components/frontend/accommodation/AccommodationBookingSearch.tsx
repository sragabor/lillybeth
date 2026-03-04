'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { DateRangePicker } from '@/components/frontend/ui/DateRangePicker';

interface AccommodationBookingSearchProps {
  accommodationId: string;
  accommodationSlug: string;
}

export function AccommodationBookingSearch({
  accommodationId,
}: AccommodationBookingSearchProps) {
  const router = useRouter();
  const { t } = useFrontendLanguage();
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;

    const params = new URLSearchParams({
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: guests.toString(),
      accommodationId: accommodationId,
    });

    router.push(`/frontend/search?${params}`);
  };

  return (
    <section id="booking-search" className="relative -mt-20 z-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-stone-100">
          <h2 className="text-xl font-serif font-semibold text-stone-800 mb-6 text-center">
            {t.accommodation.checkAvailability}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Date Range Picker */}
            <div className="md:col-span-2">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                {t.search.guests}
              </label>
              <div className="relative">
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 appearance-none cursor-pointer hover:border-stone-300 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? t.search.guestSingular : t.search.guestPlural}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Search Button */}
            <div>
              <button
                onClick={handleSearch}
                disabled={!checkIn || !checkOut}
                className="w-full px-6 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors shadow-lg hover:shadow-xl disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{t.search.searchButton}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
