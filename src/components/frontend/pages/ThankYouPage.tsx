'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

interface BookingDetails {
  id: string;
  type: 'single' | 'group';
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  roomCount: number;
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
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-3">
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
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white mb-2">
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

              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm text-stone-600">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm text-stone-600">
                    {bookingDetails.roomCount} {bookingDetails.roomCount === 1 ? 'room' : 'rooms'}
                  </span>
                </div>
              </div>
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

            {/* What's Next */}
            <div className="py-6">
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">
                {t.thankYou?.whatsNext || "What's Next?"}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-stone-600">
                    {t.thankYou?.emailSent || 'A confirmation email has been sent to your inbox'}
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-stone-600">2</span>
                  </div>
                  <p className="text-sm text-stone-600">
                    {t.thankYou?.reviewDetails || 'Review your booking details in the email'}
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-stone-600">3</span>
                  </div>
                  <p className="text-sm text-stone-600">
                    {t.thankYou?.contactUs || "Contact us if you have any questions"}
                  </p>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
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

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-stone-500">
            {t.thankYou?.questions || 'Have questions?'}{' '}
            <a href="mailto:info@lillybeth.com" className="text-stone-700 font-medium hover:underline">
              {t.thankYou?.contactSupport || 'Contact our support team'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
