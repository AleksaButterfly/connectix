'use client'

declare global {
  interface Window {
    __isNotFoundPage?: boolean
  }
}

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { FormattedMessage } from '@/lib/i18n'

export default function NotFound() {
  const pathname = usePathname() || '/404'

  useEffect(() => {
    // Set a flag that AuthProvider can check
    if (typeof window !== 'undefined') {
      window.__isNotFoundPage = true
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.__isNotFoundPage = false
      }
    }
  }, [])

  return (
    <>
      <Header />
      <main className="relative flex-1">
        <div className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <div className="terminal-window animate-fade-in">
              {/* Terminal Header */}
              <div className="terminal-header">
                <div className="flex gap-1.5">
                  <div className="terminal-dot bg-terminal-red" />
                  <div className="terminal-dot bg-terminal-yellow" />
                  <div className="terminal-dot bg-terminal-green" />
                </div>
                <div className="ml-4 text-xs text-foreground-subtle">connectix@ssh-manager:~</div>
              </div>

              {/* Terminal Content */}
              <div className="p-6">
                <div className="space-y-3 font-mono text-sm">
                  {/* Command */}
                  <div className="flex items-start gap-2">
                    <span className="text-terminal-green">$</span>
                    <span className="text-foreground">cd {pathname}</span>
                  </div>

                  {/* Error Output */}
                  <div className="ml-4 space-y-2">
                    <p className="text-terminal-red">
                      <FormattedMessage id="notFound.terminal.error" values={{ pathname }} />
                    </p>
                  </div>

                  {/* Status Check */}
                  <div className="flex items-start gap-2">
                    <span className="text-terminal-green">$</span>
                    <span className="text-foreground">echo $?</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-foreground-muted">1</p>
                  </div>

                  {/* Error Code Display */}
                  <div className="flex items-start gap-2">
                    <span className="text-terminal-green">$</span>
                    <span className="text-foreground">connectix --status</span>
                  </div>
                  <div className="ml-4 space-y-2">
                    <p className="text-terminal-yellow">
                      [<FormattedMessage id="notFound.terminal.warning" />]{' '}
                      <FormattedMessage id="notFound.terminal.pageNotFound" />
                    </p>
                    <p className="text-foreground-muted">
                      <FormattedMessage id="notFound.terminal.errorCode" />: 404
                    </p>
                    <p className="text-foreground-muted">
                      <FormattedMessage id="notFound.terminal.errorDescription" />
                    </p>
                  </div>

                  {/* Suggestions */}
                  <div className="flex items-start gap-2">
                    <span className="text-terminal-green">$</span>
                    <span className="text-foreground">connectix --help</span>
                  </div>
                  <div className="ml-4 space-y-2">
                    <p className="text-foreground">
                      <FormattedMessage id="notFound.terminal.availableCommands" />:
                    </p>
                    <ul className="ml-4 space-y-1 text-foreground-muted">
                      <li>
                        <span className="text-terminal-blue">→</span>{' '}
                        <FormattedMessage
                          id="notFound.terminal.returnTo"
                          values={{
                            link: (
                              <Link href="/" className="text-terminal-blue hover:underline">
                                <FormattedMessage id="notFound.terminal.homeDirectory" />
                              </Link>
                            ),
                          }}
                        />
                      </li>
                      <li>
                        <span className="text-terminal-purple">→</span>{' '}
                        <FormattedMessage
                          id="notFound.terminal.check"
                          values={{
                            link: (
                              <Link href="/status" className="text-terminal-purple hover:underline">
                                <FormattedMessage id="notFound.terminal.systemStatus" />
                              </Link>
                            ),
                          }}
                        />
                      </li>
                      <li>
                        <span className="text-terminal-orange">→</span>{' '}
                        <FormattedMessage
                          id="notFound.terminal.view"
                          values={{
                            link: (
                              <Link href="/docs" className="text-terminal-orange hover:underline">
                                <FormattedMessage id="notFound.terminal.documentation" />
                              </Link>
                            ),
                          }}
                        />
                      </li>
                      <li>
                        <span className="text-terminal-pink">→</span>{' '}
                        <FormattedMessage
                          id="notFound.terminal.contact"
                          values={{
                            link: (
                              <Link href="/about" className="text-terminal-pink hover:underline">
                                <FormattedMessage id="notFound.terminal.supportTeam" />
                              </Link>
                            ),
                          }}
                        />
                      </li>
                    </ul>
                  </div>

                  {/* Prompt */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-terminal-green">$</span>
                    <span className="text-foreground opacity-50">_</span>
                    <span className="terminal-cursor"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex animate-slide-up justify-center gap-4">
              <Link href="/" className="btn-primary inline-flex items-center gap-2">
                <span>
                  ← <FormattedMessage id="notFound.buttons.goHome" />
                </span>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <span>
                  <FormattedMessage id="notFound.buttons.goBack" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
