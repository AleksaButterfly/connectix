import DashboardHeader from '@/components/dashboard/DashboardHeader'
// import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import RouteGuard from '@/components/auth/RouteGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth requireVerified>
      <div className="flex h-screen bg-background">
        {/* Sidebar - hidden for now as requested */}
        {/* <DashboardSidebar /> */}

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <DashboardHeader />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RouteGuard>
  )
}
