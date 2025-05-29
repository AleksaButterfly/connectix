'use client'

import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/lib/auth/auth.service'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent double clicks

    try {
      setIsSigningOut(true)

      // Force clear the session using Supabase client directly
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        // Force clear anyway
        await supabase.auth.signOut({ scope: 'local' })
      }

      // Clear user from store
      setUser(null)

      // Navigate to login
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, try to navigate to login
      router.push('/login')
    } finally {
      setIsSigningOut(false)
    }
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

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="btn-secondary mt-8 disabled:opacity-50"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
