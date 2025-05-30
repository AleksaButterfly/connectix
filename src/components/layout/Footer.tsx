import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full px-6 pb-6">
      <div className="mx-auto max-w-4xl rounded-lg border border-border bg-background-secondary">
        <div className="px-6 py-8">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-terminal-green">
                  <span className="text-sm font-bold text-background">C</span>
                </div>
                <span className="text-lg font-semibold text-foreground">Connectix</span>
                <span className="animate-terminal-blink text-terminal-green opacity-0 group-hover:opacity-100">
                  _
                </span>
              </Link>
              <p className="mt-3 text-xs text-foreground-subtle">
                Secure SSH file manager for developers
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/features"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    System Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-foreground-subtle">
                © 2025 Connectix. All rights reserved.
              </p>
              <div className="flex items-center text-xs text-foreground-subtle">
                <span className="text-terminal-green">●</span>
                <span>&nbsp;All systems operational | v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
