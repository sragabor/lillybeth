import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import DashboardCalendar from './components/DashboardCalendar'
import DashboardActions from './components/DashboardActions'

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  // Fetch stats (only booking-related stats needed now)
  let stats = {
    todayCheckIns: 0,
    todayCheckOuts: 0,
    incomingBookings: 0,
  }

  // Summary statistics
  let summaryStats = {
    totalBookings: 0,
    openBookings: 0,
    unpaidBookings: 0,
    currentlyStayingGuests: 0,
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    const [
      todayCheckIns,
      todayCheckOuts,
      incomingBookings,
      totalBookings,
      openBookings,
      unpaidBookings,
      currentlyStayingBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          checkIn: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.count({
        where: {
          checkOut: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.count({
        where: {
          status: 'INCOMING',
        },
      }),
      // Total bookings (excluding cancelled)
      prisma.booking.count({
        where: {
          status: { not: 'CANCELLED' },
        },
      }),
      // Open/not completed bookings (INCOMING, CONFIRMED, or CHECKED_IN)
      prisma.booking.count({
        where: {
          status: { in: ['INCOMING', 'CONFIRMED', 'CHECKED_IN'] },
        },
      }),
      // Unpaid bookings (payment status is not FULLY_PAID, excluding cancelled)
      prisma.booking.count({
        where: {
          status: { not: 'CANCELLED' },
          paymentStatus: { not: 'FULLY_PAID' },
        },
      }),
      // Currently staying guests (checkIn <= today < checkOut AND status is CHECKED_IN)
      prisma.booking.aggregate({
        _sum: { guestCount: true },
        where: {
          checkIn: { lte: today },
          checkOut: { gt: today },
          status: 'CHECKED_IN',
        },
      }),
    ])
    stats = {
      todayCheckIns,
      todayCheckOuts,
      incomingBookings,
    }
    summaryStats = {
      totalBookings,
      openBookings,
      unpaidBookings,
      currentlyStayingGuests: currentlyStayingBookings._sum.guestCount || 0,
    }
  } catch {
    // Database might not be connected yet
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">Welcome back, {session.name}</p>
      </div>

      {/* Today's Overview */}
      {(stats.todayCheckIns > 0 || stats.todayCheckOuts > 0 || stats.incomingBookings > 0) && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h2 className="text-sm font-medium text-amber-800 mb-2">Today&apos;s Overview</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.todayCheckIns > 0 && (
              <span className="text-amber-700">
                <strong>{stats.todayCheckIns}</strong> check-in{stats.todayCheckIns !== 1 ? 's' : ''}
              </span>
            )}
            {stats.todayCheckOuts > 0 && (
              <span className="text-amber-700">
                <strong>{stats.todayCheckOuts}</strong> check-out{stats.todayCheckOuts !== 1 ? 's' : ''}
              </span>
            )}
            {stats.incomingBookings > 0 && (
              <span className="text-amber-700">
                <strong>{stats.incomingBookings}</strong> pending confirmation{stats.incomingBookings !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions & Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-stone-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap items-start gap-6">
          <DashboardActions />

          {/* Summary Statistics */}
          <div className="flex flex-wrap gap-3">
            {/* Total Bookings */}
            <div className="px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm min-w-[120px]">
              <p className="text-2xl font-semibold text-stone-900">{summaryStats.totalBookings}</p>
              <p className="text-xs text-stone-500">Total Bookings</p>
            </div>

            {/* Open Bookings */}
            <div className="px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm min-w-[120px]">
              <p className="text-2xl font-semibold text-amber-600">{summaryStats.openBookings}</p>
              <p className="text-xs text-stone-500">Open Bookings</p>
            </div>

            {/* Unpaid Bookings */}
            <div className="px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm min-w-[120px]">
              <p className={`text-2xl font-semibold ${summaryStats.unpaidBookings > 0 ? 'text-red-600' : 'text-stone-900'}`}>
                {summaryStats.unpaidBookings}
              </p>
              <p className="text-xs text-stone-500">Unpaid</p>
            </div>

            {/* Currently Staying */}
            <div className="px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm min-w-[120px]">
              <p className="text-2xl font-semibold text-green-600">{summaryStats.currentlyStayingGuests}</p>
              <p className="text-xs text-stone-500">Guests Staying</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Overview */}
      <div>
        <h2 className="text-lg font-medium text-stone-800 mb-4">Calendar Overview</h2>
        <p className="text-sm text-stone-500 mb-4">Read-only view. Go to Calendar for full editing.</p>
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <DashboardCalendar />
        </div>
      </div>
    </div>
  )
}
