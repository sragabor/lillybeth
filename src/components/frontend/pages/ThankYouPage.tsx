'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { siteConfig, getWhatsAppLink } from '@/config/site';
import { replacePlaceholders } from '@/contents';

interface BookingDetails {
  id: string;
  type: 'single' | 'group';
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  roomCount: number;
  totalGuests: number;
  guestCounts: number[];
}

export function ThankYouPage() {
  const searchParams = useSearchParams();
  const { t, language } = useFrontendLanguage();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [showNoBooking, setShowNoBooking] = useState(false);
  const hasProcessedParams = useRef(false);

  useEffect(() => {
    // Only process once to avoid redirect loops
    if (hasProcessedParams.current) return;
    hasProcessedParams.current = true;

    // Parse booking details from URL params
    const id = searchParams.get('id');
    const type = searchParams.get('type') as 'single' | 'group';
    const guestName = searchParams.get('name');
    const guestEmail = searchParams.get('email');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const totalAmount = searchParams.get('total');
    const roomCount = searchParams.get('rooms');
    const guests = searchParams.get('guests');
    const guestCountsStr = searchParams.get('guestCounts');

    if (id && type && guestName && checkIn && checkOut) {
      setBookingDetails({
        id,
        type,
        guestName: decodeURIComponent(guestName),
        guestEmail: guestEmail ? decodeURIComponent(guestEmail) : '',
        checkIn,
        checkOut,
        totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
        roomCount: roomCount ? parseInt(roomCount, 10) : 1,
        totalGuests: guests ? parseInt(guests, 10) : 0,
        guestCounts: guestCountsStr ? guestCountsStr.split(',').map(Number) : [],
      });
    } else {
      // No valid booking params, show message instead of redirecting
      setShowNoBooking(true);
    }
  }, [searchParams]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'hu' ? 'hu-HU' : language === 'de' ? 'de-DE' : 'en-US',
      { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    );
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (showNoBooking) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-birthstone font-semibold text-stone-800 mb-3">
              {t.thankYou?.noBookingFound || 'No Booking Found'}
            </h2>
            <p className="text-stone-600 mb-6">
              {t.thankYou?.noBookingDescription || 'We could not find booking details. Please start a new search.'}
            </p>
            <Link
              href="/frontend/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-900 font-semibold rounded-xl transition-colors"
            >
              {t.search.searchButton}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  const nights = calculateNights(bookingDetails.checkIn, bookingDetails.checkOut);
  const showGuestBreakdown =
    bookingDetails.type === 'group' && bookingDetails.guestCounts.length > 1;

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-birthstone font-semibold text-white mb-2">
              {t.booking?.confirmationTitle || 'Booking Confirmed!'}
            </h1>
            <p className="text-white/90 text-sm md:text-base">
              {t.booking?.confirmationMessage || 'Thank you for your booking. We have sent a confirmation email to your address.'}
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-6 md:p-8">
            {/* Reference Number */}
            <div className="text-center pb-6 border-b border-stone-100">
              <p className="text-sm text-stone-500 mb-1">
                {t.booking?.referenceNumber || 'Reference Number'}
              </p>
              <p className="text-2xl font-mono font-bold text-stone-800 tracking-wider">
                {bookingDetails.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Guest Info */}
            <div className="py-6 border-b border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-stone-800">{bookingDetails.guestName}</p>
                  {bookingDetails.guestEmail && (
                    <p className="text-sm text-stone-500">{bookingDetails.guestEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="py-6 border-b border-stone-100">
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">
                {t.booking?.summary || 'Stay Details'}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500">{t.search.checkIn}</p>
                  <p className="font-medium text-stone-800">{formatDate(bookingDetails.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">{t.search.checkOut}</p>
                  <p className="font-medium text-stone-800">{formatDate(bookingDetails.checkOut)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-stone-50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm text-stone-600">
                    {nights} {nights === 1 ? t.booking?.nightSingular : t.booking?.nightsPlural}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm text-stone-600">
                    {bookingDetails.roomCount} {bookingDetails.roomCount === 1 ? t.booking?.roomSingular : t.booking?.roomsPlural}
                  </span>
                </div>
                {bookingDetails.totalGuests > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-stone-600">
                      {replacePlaceholders(
                        bookingDetails.totalGuests === 1
                          ? t.buildings?.capacitySingular
                          : t.buildings?.capacity,
                        { count: bookingDetails.totalGuests }
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Per-room guest breakdown for group bookings */}
              {showGuestBreakdown && (
                <div className="mt-4 pt-4 border-t border-stone-50">
                  <div className="flex flex-wrap gap-2">
                    {bookingDetails.guestCounts.map((count, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 bg-stone-100 rounded-full text-xs text-stone-600"
                      >
                        {t.booking?.room} {i + 1}:{' '}
                        {replacePlaceholders(
                          count === 1
                            ? t.buildings?.capacitySingular
                            : t.buildings?.capacity,
                          { count }
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            {bookingDetails.totalAmount > 0 && (
              <div className="py-6 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-stone-700">
                    {t.booking?.total || 'Total'}
                  </span>
                  <span className="text-2xl font-bold text-stone-800">
                    {'\u20AC'}{bookingDetails.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Have questions? – Contact Block */}
            <div className="py-6 border-b border-stone-100">
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">
                {t.thankYou?.questions || 'Have questions?'}
              </h3>
              <div className="space-y-3">
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="flex items-center gap-3 text-sm text-stone-700 hover:text-stone-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">{t.footer?.contact?.phone || 'Phone'}</p>
                    <p className="font-medium">{siteConfig.contact.phone}</p>
                  </div>
                </a>

                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-center gap-3 text-sm text-stone-700 hover:text-stone-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">{t.footer?.contact?.email || 'Email'}</p>
                    <p className="font-medium">{siteConfig.contact.email}</p>
                  </div>
                </a>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-stone-700 hover:text-stone-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-stone-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">{t.thankYou?.whatsApp || 'WhatsApp'}</p>
                    <p className="font-medium">{siteConfig.contact.phone}</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/frontend"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t.common.backToHome}
              </Link>
              <Link
                href={`/frontend/${t.routes.accommodation}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
              >
                {t.header.nav.accommodations}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
