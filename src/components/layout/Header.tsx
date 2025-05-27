import Link from 'next/link'

export default function Header() {
  return (
    <header className="w-full px-6 pt-6">
      <nav className="mx-auto max-w-4xl rounded-lg border border-border bg-background-secondary">
        <div className="px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand */}
            <Link
              href="/"
              className="group flex items-center gap-2 text-lg font-bold transition-colors hover:text-terminal-green"
            >
              <span className="text-terminal-green">$</span>
              <span>Connectix</span>
              <span className="animate-terminal-blink text-terminal-green opacity-0 group-hover:opacity-100">
                _
              </span>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-8">
              <Link
                href="/about"
                className="text-sm text-foreground-muted transition-colors hover:text-foreground"
              >
                About Connectix
              </Link>

              <Link href="/login" className="btn-primary text-sm">
                Sign in to Console →
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
