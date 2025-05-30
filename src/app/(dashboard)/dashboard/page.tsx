'use client'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/lib/auth/auth.service'
import { useRouter } from 'next/navigation'
import RouteGuard from '@/components/auth/RouteGuard'

export default function DashboardPage() {
  return (
    <RouteGuard requireAuth requireVerified>
      <DashboardContent />
    </RouteGuard>
  )
}

function DashboardContent() {
  const { user } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await authService.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="flex gap-1.5">
              <div className="terminal-dot bg-terminal-red" />
              <div className="terminal-dot bg-terminal-yellow" />
              <div className="terminal-dot bg-terminal-green" />
            </div>
            <div className="ml-4 text-xs text-foreground-subtle">connectix@dashboard:~</div>
          </div>

          <div className="p-8">
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              <span className="text-terminal-green">$</span> Welcome to Connectix
            </h1>

            <div className="mb-8 space-y-2 font-mono text-sm">
              <p className="text-foreground-muted">
                <span className="text-terminal-green">user@connectix</span>:~$ whoami
              </p>
              <p className="ml-4 text-foreground">{user?.email}</p>

              <p className="text-foreground-muted">
                <span className="text-terminal-green">user@connectix</span>:~$ id
              </p>
              <p className="ml-4 text-foreground">uid={user?.id?.slice(0, 8)}...</p>
            </div>

            <div className="space-y-4">
              <p className="text-foreground">Dashboard coming soon! We'll build:</p>
              <ul className="ml-4 space-y-1 text-sm text-foreground-muted">
                <li>• SSH connection manager</li>
                <li>• File browser</li>
                <li>• Terminal interface</li>
                <li>• Server monitoring</li>
              </ul>

              <button onClick={handleSignOut} className="btn-secondary mt-8">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
