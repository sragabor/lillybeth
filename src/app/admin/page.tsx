import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  // Fetch stats
  let stats = {
    buildings: 0,
    roomTypes: 0,
    rooms: 0,
    bookings: 0,
  }

  try {
    const [buildings, roomTypes, rooms, bookings] = await Promise.all([
      prisma.building.count(),
      prisma.roomType.count(),
      prisma.room.count(),
      prisma.booking.count(),
    ])
    stats = { buildings, roomTypes, rooms, bookings }
  } catch {
    // Database might not be connected yet
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">Welcome back, {session.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Buildings"
          value={stats.buildings}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="amber"
        />
        <StatCard
          title="Room Types"
          value={stats.roomTypes}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Rooms"
          value={stats.rooms}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Bookings"
          value={stats.bookings}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-stone-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            href="/admin/buildings"
            title="Manage Buildings"
            description="Add or edit properties"
          />
          <QuickAction
            href="/admin/bookings"
            title="View Bookings"
            description="See timeline and manage reservations"
          />
          <QuickAction
            href="/admin/users"
            title="Manage Users"
            description="Add or remove admin users"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'amber' | 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold text-stone-800">{value}</p>
          <p className="text-sm text-stone-500">{title}</p>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-2xl shadow-sm border border-stone-100 p-6 hover:shadow-md hover:border-stone-200 transition-all group"
    >
      <h3 className="font-medium text-stone-800 group-hover:text-amber-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-stone-500 mt-1">{description}</p>
    </a>
  )
}
