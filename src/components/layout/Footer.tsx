'use client'

import Link from 'next/link'
import { FormattedMessage } from '@/lib/i18n'

export default function Footer() {
  const currentYear = new Date().getFullYear()

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
                <FormattedMessage id="footer.tagline" />
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                <FormattedMessage id="footer.product.title" />
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/features"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.product.features" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.product.pricing" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.product.changelog" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.product.roadmap" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                <FormattedMessage id="footer.resources.title" />
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.resources.documentation" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.resources.api" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.resources.security" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.resources.status" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                <FormattedMessage id="footer.company.title" />
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.company.about" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.company.blog" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.company.privacy" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-foreground-muted transition-colors hover:text-terminal-green"
                  >
                    <FormattedMessage id="footer.company.terms" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-foreground-subtle">
                <FormattedMessage
                  id="footer.copyright"
                  values={{ year: currentYear, company: 'Connectix' }}
                />
              </p>
              <div className="flex items-center text-xs text-foreground-subtle">
                <span className="text-terminal-green">●</span>
                <span>
                  &nbsp;
                  <FormattedMessage id="footer.status" values={{ version: 'v1.0.0' }} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
