'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  minDate?: Date;
  className?: string;
}

const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hu: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
};

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hu: ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
};

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate = new Date(),
  className = '',
}: DateRangePickerProps) {
  const { language, t } = useFrontendLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const weekdays = WEEKDAYS[language] || WEEKDAYS.en;
  const months = MONTHS[language] || MONTHS.en;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(language === 'hu' ? 'hu-HU' : language === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const isBeforeDay = (d1: Date, d2: Date): boolean => {
    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return date1 < date2;
  };

  const isInRange = (date: Date): boolean => {
    if (!checkIn) return false;
    const endDate = checkOut || hoverDate;
    if (!endDate) return false;
    return isBeforeDay(checkIn, date) && isBeforeDay(date, endDate);
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -firstDay.getDay() + i + 1));
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    if (isBeforeDay(date, minDate)) return;

    if (!selectingCheckOut || !checkIn) {
      // Selecting check-in
      onCheckInChange(date);
      onCheckOutChange(null);
      setSelectingCheckOut(true);
    } else {
      // Selecting check-out
      if (isBeforeDay(date, checkIn)) {
        // If clicked date is before check-in, reset
        onCheckInChange(date);
        onCheckOutChange(null);
      } else if (isSameDay(date, checkIn)) {
        // If same day, ignore
        return;
      } else {
        onCheckOutChange(date);
        setSelectingCheckOut(false);
        setIsOpen(false);
      }
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev >= new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      setCurrentMonth(prev);
    }
  };

  const getNextMonth = (): Date => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  };

  const renderCalendar = (monthDate: Date) => {
    const days = getDaysInMonth(monthDate);
    const monthIndex = monthDate.getMonth();

    return (
      <div className="w-full">
        {/* Month Header */}
        <div className="text-center font-medium text-stone-800 mb-4">
          {months[monthIndex]} {monthDate.getFullYear()}
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-px">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === monthIndex;
            const isDisabled = isBeforeDay(date, minDate);
            const isCheckIn = checkIn && isSameDay(date, checkIn);
            const isCheckOut = checkOut && isSameDay(date, checkOut);
            const isSelected = isCheckIn || isCheckOut;
            const isRangeDay = isInRange(date);
            const isHoverEnd = hoverDate && checkIn && !checkOut && isSameDay(date, hoverDate);

            return (
              <button
                key={index}
                type="button"
                disabled={isDisabled || !isCurrentMonth}
                onClick={() => isCurrentMonth && handleDateClick(date)}
                onMouseEnter={() => isCurrentMonth && !isDisabled && setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                className={`
                  relative h-10 sm:h-11 text-sm font-medium
                  transition-all duration-200
                  ${!isCurrentMonth ? 'invisible' : ''}
                  ${isDisabled ? 'text-stone-300 cursor-not-allowed' : 'hover:bg-stone-100'}
                  ${isSelected ? 'bg-stone-800 text-white hover:bg-stone-700 rounded-full z-10' : ''}
                  ${isRangeDay ? 'bg-stone-100' : ''}
                  ${isHoverEnd && !isCheckIn ? 'bg-stone-200 rounded-full' : ''}
                  ${isCheckIn && (checkOut || hoverDate) ? 'rounded-l-full' : ''}
                  ${isCheckOut ? 'rounded-r-full' : ''}
                  ${!isSelected && !isRangeDay && !isDisabled && isCurrentMonth ? 'text-stone-700' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Fields */}
      <div className="flex rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Check-in */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setSelectingCheckOut(false);
          }}
          className={`
            flex-1 px-4 py-3 text-left transition-all duration-200
            ${isOpen && !selectingCheckOut ? 'bg-stone-50 ring-2 ring-inset ring-stone-300' : ''}
          `}
        >
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
            {t.search.checkIn}
          </div>
          <div className={`text-sm ${checkIn ? 'text-stone-800 font-medium' : 'text-stone-400'}`}>
            {checkIn ? formatDate(checkIn) : t.search.selectDate}
          </div>
        </button>

        {/* Divider */}
        <div className="w-px bg-stone-200" />

        {/* Check-out */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            if (checkIn) setSelectingCheckOut(true);
          }}
          className={`
            flex-1 px-4 py-3 text-left transition-all duration-200
            ${isOpen && selectingCheckOut ? 'bg-stone-50 ring-2 ring-inset ring-stone-300' : ''}
          `}
        >
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
            {t.search.checkOut}
          </div>
          <div className={`text-sm ${checkOut ? 'text-stone-800 font-medium' : 'text-stone-400'}`}>
            {checkOut ? formatDate(checkOut) : t.search.selectDate}
          </div>
        </button>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white rounded-2xl shadow-2xl border border-stone-200
            p-4 sm:p-6
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors duration-200 text-stone-600"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors duration-200 text-stone-600"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendars - Side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {renderCalendar(currentMonth)}
            <div className="hidden sm:block">
              {renderCalendar(getNextMonth())}
            </div>
          </div>

          {/* Selection hint */}
          <div className="mt-4 pt-4 border-t border-stone-100 text-center text-sm text-stone-500">
            {!checkIn && (language === 'hu' ? 'Válassza ki az érkezés dátumát' : language === 'de' ? 'Anreisedatum wählen' : 'Select check-in date')}
            {checkIn && !checkOut && (language === 'hu' ? 'Válassza ki a távozás dátumát' : language === 'de' ? 'Abreisedatum wählen' : 'Select check-out date')}
            {checkIn && checkOut && (
              <button
                type="button"
                onClick={() => {
                  onCheckInChange(null);
                  onCheckOutChange(null);
                  setSelectingCheckOut(false);
                }}
                className="text-stone-700 underline hover:no-underline"
              >
                {language === 'hu' ? 'Dátumok törlése' : language === 'de' ? 'Daten löschen' : 'Clear dates'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
