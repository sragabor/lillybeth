'use client';

import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

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

interface BestMatchCardProps {
  combination: RoomCombination;
  getLocalizedText: (field: Record<string, string> | string | null | undefined) => string;
  onSelect: () => void;
}

export function BestMatchCard({
  combination,
  getLocalizedText,
  onSelect,
}: BestMatchCardProps) {
  const { t } = useFrontendLanguage();

  return (
    <div className="relative bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Best Match Badge */}
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <div className="bg-amber-400 text-stone-900 px-6 py-2 rounded-b-xl font-semibold text-sm flex items-center gap-2 shadow-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>{t.search.bestMatch || 'Best Match'}</span>
        </div>
      </div>

      <div className="p-6 pt-14 md:p-8 md:pt-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Combination Details */}
          <div className="flex-1">
            <p className="text-stone-400 text-sm mb-3">
              {getLocalizedText(combination.accommodationName)}
            </p>

            {/* Room List */}
            <div className="space-y-2 mb-4">
              {combination.items.map((item, idx) => (
                <div
                  key={`${item.roomTypeId}-${idx}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full text-white text-sm font-medium">
                    {item.quantity}×
                  </span>
                  <span className="text-white font-medium">
                    {getLocalizedText(item.roomTypeName)}
                  </span>
                  <span className="text-stone-400 text-sm">
                    ({t.common.max} {item.capacity} {item.capacity === 1 ? t.search.guestSingular : t.search.guestPlural})
                  </span>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-stone-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>
                  {combination.totalRooms} {combination.totalRooms === 1 ? t.booking.roomSingular : t.booking.roomsPlural}
                </span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>
                  {t.common.max} {combination.totalCapacity} {combination.totalCapacity === 1 ? t.search.guestSingular : t.search.guestPlural}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Price and CTA */}
          <div className="flex flex-col items-start lg:items-end gap-4">
            {combination.totalPricePerNight > 0 && (
              <div className="text-right">
                <p className="text-stone-400 text-sm">{t.accommodation.fromPrice}</p>
                <p className="text-3xl font-bold text-white">
                  €{combination.totalPricePerNight}
                  <span className="text-lg font-normal text-stone-400">
                    {t.accommodation.perNight}
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={onSelect}
              className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-stone-900 font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t.search.selectBestMatch || 'Select Best Match'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
