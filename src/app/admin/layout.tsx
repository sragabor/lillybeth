import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AdminProviders } from '@/components/admin/AdminProviders'
import { NotificationsProvider } from '@/contexts/NotificationsContext'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <AdminProviders>
      <div className="min-h-screen bg-stone-50">
        {session ? (
          <NotificationsProvider>
            <div className="flex">
              <AdminSidebar user={session} />
              <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">{children}</main>
            </div>
          </NotificationsProvider>
        ) : (
          <>{children}</>
        )}
      </div>
    </AdminProviders>
  )
}
