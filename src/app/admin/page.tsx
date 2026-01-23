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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    const [
      todayCheckIns,
      todayCheckOuts,
      incomingBookings,
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
    ])
    stats = {
      todayCheckIns,
      todayCheckOuts,
      incomingBookings,
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-stone-800 mb-4">Quick Actions</h2>
        <DashboardActions />
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
