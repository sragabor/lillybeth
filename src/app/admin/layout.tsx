import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AdminProviders } from '@/components/admin/AdminProviders'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Allow access to login page without auth
  // The login page handles its own redirect if already authenticated

  return (
    <AdminProviders>
      <div className="min-h-screen bg-stone-50">
        {session ? (
          <div className="flex">
            <AdminSidebar user={session} />
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">{children}</main>
          </div>
        ) : (
          <>{children}</>
        )}
      </div>
    </AdminProviders>
  )
}
