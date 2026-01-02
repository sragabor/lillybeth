import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Allow access to login page without auth
  // The login page handles its own redirect if already authenticated

  return (
    <div className="min-h-screen bg-stone-50">
      {session ? (
        <div className="flex">
          <AdminSidebar user={session} />
          <main className="flex-1 ml-64 p-8">{children}</main>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  )
}
