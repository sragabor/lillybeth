'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { DateRangePicker } from '../ui/DateRangePicker';

export function SearchSection() {
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
    });

    router.push(`/frontend/search?${params}`);
  };

  const incrementGuests = () => setGuests((prev) => Math.min(prev + 1, 20));
  const decrementGuests = () => setGuests((prev) => Math.max(prev - 1, 1));

  return (
    <section id="search-section" className="relative z-30 -mt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div
          className="
            bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl
            p-6 sm:p-8 lg:p-10
            border border-white/50
            animate-in fade-in slide-in-from-bottom-4 duration-700
          "
        >
          {/* Section Title */}
          <h2 className="text-center font-serif text-2xl sm:text-3xl text-stone-800 mb-8">
            {t.search.title}
          </h2>

          {/* Search Form */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-end">
            {/* Date Range Picker */}
            <div className="flex-1 lg:flex-[2]">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />
            </div>

            {/* Guests Counter */}
            <div className="flex-1">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2 px-1">
                {t.search.guests}
              </div>
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300 h-[58px]">
                <button
                  type="button"
                  onClick={decrementGuests}
                  disabled={guests <= 1}
                  className="
                    w-14 h-full flex items-center justify-center
                    text-stone-600 hover:bg-stone-50 active:bg-stone-100
                    transition-colors duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                  aria-label="Decrease guests"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-semibold text-stone-800">{guests}</span>
                  <span className="ml-1.5 text-sm text-stone-500">
                    {guests === 1 ? t.search.guestSingular : t.search.guestPlural}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={incrementGuests}
                  disabled={guests >= 20}
                  className="
                    w-14 h-full flex items-center justify-center
                    text-stone-600 hover:bg-stone-50 active:bg-stone-100
                    transition-colors duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                  aria-label="Increase guests"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex-1 lg:flex-none">
              <div className="text-xs font-medium text-transparent select-none mb-2 hidden lg:block">
                &nbsp;
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={!checkIn || !checkOut}
                className="
                  w-full lg:w-auto h-[58px] px-8
                  bg-amber-400 hover:bg-amber-300 active:bg-amber-500
                  disabled:bg-stone-300 disabled:cursor-not-allowed
                  text-stone-900 font-semibold
                  rounded-xl
                  transition-all duration-300
                  flex items-center justify-center gap-2
                  shadow-lg hover:shadow-xl
                  hover:-translate-y-0.5 active:translate-y-0
                  disabled:hover:translate-y-0 disabled:hover:shadow-lg
                  disabled:text-stone-500
                "
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{t.search.searchButton}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
