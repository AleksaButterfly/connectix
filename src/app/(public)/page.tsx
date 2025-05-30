'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-10rem)] px-4 py-16">
      <div className="mx-auto w-full max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            SSH Management <span className="text-terminal-green">Reimagined</span>
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-lg text-foreground-muted">
            Secure terminal access, file management, and team collaboration. All your servers in one
            powerful platform.
          </p>
          <p className="mb-8 text-sm text-foreground-muted">
            Start free • No credit card required • Set up in 2 minutes
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/organizations"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>Start your project</span>
              <span className="text-lg">→</span>
            </Link>
            <Link href="/" className="btn-secondary inline-flex items-center gap-2">
              <span>Request a demo</span>
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mb-12 flex flex-wrap justify-center gap-6 opacity-60">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>🔒</span>
            <span>SOC2 Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>🛡️</span>
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>🔐</span>
            <span>Zero-Knowledge Architecture</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>✓</span>
            <span>GDPR Ready</span>
          </div>
        </div>

        {/* Terminal Window */}
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
          <div className="p-8">
            {/* Welcome Message */}
            <div className="space-y-4 text-foreground">
              <p className="text-terminal-green">
                <span className="text-foreground-muted">$</span> ./connectix --help
              </p>

              <div className="ml-4 space-y-2">
                <p>Connectix - Complete SSH Management Platform for Teams</p>
                <p className="text-foreground-muted">
                  Terminal, file manager, and team collaboration. All your servers, one secure
                  platform.
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-terminal-green">
                  <span className="text-foreground-muted">$</span> ./connectix --features
                </p>

                <ul className="ml-4 space-y-1 text-sm">
                  <li>
                    <span className="text-terminal-blue">[+]</span> Integrated terminal & file
                    browser
                  </li>
                  <li>
                    <span className="text-terminal-purple">[+]</span> Team access control &
                    permissions
                  </li>
                  <li>
                    <span className="text-terminal-orange">[+]</span> Multi-project organization
                  </li>
                  <li>
                    <span className="text-terminal-pink">[+]</span> Real-time collaboration
                  </li>
                  <li>
                    <span className="text-terminal-yellow">[+]</span> Complete audit trail
                  </li>
                  <li>
                    <span className="text-terminal-green">[+]</span> Secure credential management
                  </li>
                </ul>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <p className="text-terminal-green">
                  <span className="text-foreground-muted">$</span> ./connectix --start
                </p>
                <span className="terminal-cursor"></span>
              </div>
            </div>

            {/* Status Line */}
            <div className="mt-8 border-t border-border pt-4">
              <p className="text-xs text-foreground-subtle">
                <span className="text-terminal-green">●</span>
                <span>&nbsp;System ready | Version 1.0.0 | Enterprise-grade security</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Feature Cards */}
        <div className="mt-8 grid animate-slide-up gap-6 md:grid-cols-3">
          <FeatureCard
            icon="💻"
            title="Integrated Terminal"
            description="Full terminal access right in your browser. Run commands, edit files, manage services."
          />
          <FeatureCard
            icon="👥"
            title="Team Collaboration"
            description="Grant specific permissions by folder, server, or project. See who's doing what in real-time."
          />
          <FeatureCard
            icon="📁"
            title="Project Organization"
            description="Group servers by client, environment, or team. Switch contexts instantly."
          />
        </div>

        {/* Social Proof Section */}
        <div className="mt-16 animate-slide-up text-center">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-terminal-green">500+</div>
              <p className="text-sm text-foreground-muted">Active Teams</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-blue">10k+</div>
              <p className="text-sm text-foreground-muted">Servers Managed</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-purple">99.9%</div>
              <p className="text-sm text-foreground-muted">Uptime SLA</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-orange">24/7</div>
              <p className="text-sm text-foreground-muted">Support</p>
            </div>
          </div>
        </div>

        {/* Why Connectix Section */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Stop juggling multiple tools
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="mb-4 font-bold text-red-400">❌ The Old Way</h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>• Terminal app + SFTP client + password manager</li>
                <li>• SSH keys shared via Slack or email</li>
                <li>• No audit trail or access history</li>
                <li>• Manual onboarding taking hours</li>
                <li>• Zero visibility into who's doing what</li>
              </ul>
            </div>

            <div className="rounded-lg border border-terminal-green/20 bg-terminal-green/5 p-6">
              <h3 className="mb-4 font-bold text-terminal-green">✓ The Connectix Way</h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>• Everything in one secure platform</li>
                <li>• Credentials encrypted and never shared</li>
                <li>• Complete audit trail with video replay</li>
                <li>• Onboard new devs in under 5 minutes</li>
                <li>• Real-time visibility and notifications</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Features Section */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Everything your team needs, in one place
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailedFeatureCard
              title="Powerful Terminal"
              features={[
                'Native terminal experience with xterm.js',
                'Persistent sessions across devices',
                'Command history and autocomplete',
                'Multi-tab support',
              ]}
            />
            <DetailedFeatureCard
              title="Smart File Management"
              features={[
                'Visual file browser with drag & drop',
                'Bulk operations and quick search',
                'File preview and inline editing',
                'Secure upload/download streaming',
              ]}
            />
            <DetailedFeatureCard
              title="Team Access Control"
              features={[
                'Role-based permissions (read/write/execute)',
                'Folder-level access restrictions',
                'Temporary access links',
                'SSO and 2FA support',
              ]}
            />
            <DetailedFeatureCard
              title="Complete Audit Trail"
              features={[
                'Track every command and file change',
                'Real-time activity monitoring',
                'Compliance-ready logging',
                'Instant security alerts',
              ]}
            />
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Built for modern teams
          </h2>

          <div className="grid gap-4">
            <UseCase
              role="Development Teams"
              description="Give developers the access they need without sharing root credentials"
              details={[
                'Create read-only access for junior developers',
                'Grant temporary elevated permissions for deployments',
                'Separate staging and production environments',
                'Track all changes with developer attribution',
              ]}
            />
            <UseCase
              role="Agencies"
              description="Manage multiple client servers with organized projects and clear boundaries"
              details={[
                'Organize servers by client and project',
                'Set up client-specific access for contractors',
                'Generate audit reports for client compliance',
                'Quick-switch between different client contexts',
              ]}
            />
            <UseCase
              role="DevOps"
              description="Streamline operations with audit trails and granular permissions"
              details={[
                'Automate access provisioning with API',
                'Set up approval workflows for sensitive operations',
                'Monitor all infrastructure changes in real-time',
                'Export logs for compliance and security audits',
              ]}
            />
            <UseCase
              role="Startups"
              description="Scale your team's server access without compromising security"
              details={[
                'Onboard new developers in minutes',
                'Revoke access instantly when team members leave',
                'Start with simple permissions, add complexity as you grow',
                'Keep infrastructure costs low with efficient resource sharing',
              ]}
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="How secure is Connectix?"
              answer="We use end-to-end encryption, zero-knowledge architecture, and are SOC2 compliant. Your credentials never touch our servers in plain text."
            />
            <FAQItem
              question="Can I self-host Connectix?"
              answer="Yes! Enterprise plans include self-hosting options for teams that need complete control over their infrastructure."
            />
            <FAQItem
              question="How does pricing work?"
              answer="Start free with up to 3 team members. Scale as you grow with transparent per-user pricing. No hidden fees."
            />
            <FAQItem
              question="What if I need help migrating?"
              answer="Our team provides white-glove migration support for all paid plans. We'll help you transition smoothly."
            />
            <FAQItem
              question="Which operating systems do you support?"
              answer="Connectix works in any modern browser. Your servers can run Linux, Unix, or any SSH-enabled system."
            />
            <FAQItem
              question="Do you offer an API?"
              answer="Yes! Our REST API lets you automate user provisioning, access management, and audit log exports."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 animate-slide-up">
          <div className="rounded-lg border-2 border-terminal-green bg-terminal-green/10 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Ready to secure your servers?
            </h2>
            <p className="mb-8 text-lg text-foreground-muted">
              Join 500+ teams already using Connectix. Get started in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard/organizations"
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg"
              >
                <span>Start Free Today</span>
                <span>→</span>
              </Link>
              <Link
                href="/pricing"
                className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-lg"
              >
                <span>View Pricing</span>
              </Link>
            </div>
            <div className="mt-6 text-sm text-foreground-muted">
              <p>✓ Free for up to 3 team members</p>
              <p>✓ No credit card required</p>
              <p>✓ Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-background-secondary p-6 transition-all hover:border-terminal-green/50 hover:shadow-terminal">
      <div className="absolute inset-0 bg-gradient-to-br from-terminal-green/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 text-2xl">{icon}</div>
        <h3 className="mb-2 font-bold text-foreground">{title}</h3>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
    </div>
  )
}

function DetailedFeatureCard({ title, features }: { title: string; features: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-background-secondary p-6">
      <h3 className="mb-4 font-bold text-foreground">{title}</h3>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
            <span className="text-terminal-green">→</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function UseCase({
  role,
  description,
  details,
}: {
  role: string
  description: string
  details: string[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg border border-border bg-background-secondary transition-all hover:border-terminal-green/50"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className={`text-terminal-green transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            >
              ▸
            </span>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{role}</h4>
              <p className="text-sm text-foreground-muted">{description}</p>
            </div>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={`grid transition-all duration-300 ${isExpanded ? 'mt-4 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <ul className="ml-6 space-y-2 border-t border-border pt-4">
              {details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                  <span className="text-terminal-green">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-background-secondary transition-all hover:border-terminal-green/50">
      <button
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-foreground">{question}</span>
        <span
          className={`text-terminal-green transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 text-sm text-foreground-muted">{answer}</p>
        </div>
      </div>
    </div>
  )
}
