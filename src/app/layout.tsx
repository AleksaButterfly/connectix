import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'
import { ToastProvider } from '@/components/ui/ToastContext'
import AuthStateListener from '@/components/auth/AuthStateListener'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Connectix - SSH File Manager',
  description: 'Secure browser-based SSH file manager for developers',
  keywords: ['SSH', 'SFTP', 'file manager', 'developer tools'],
  authors: [{ name: 'Connectix Team' }],
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <I18nProvider>
          <ToastProvider>
            {/* Auth state listener for syncing client-side auth state */}
            <AuthStateListener />

            <div className="flex min-h-screen flex-col bg-background">
              {/* Terminal-style gradient background */}
              <div className="pointer-events-none fixed inset-0 bg-gradient-to-tr from-terminal-green/5 via-transparent to-terminal-purple/5" />

              {/* Scanline effect (subtle) */}
              <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMiIgaGVpZ2h0PSIyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJhIiB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />

              {children}
            </div>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
