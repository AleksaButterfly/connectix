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
    <div className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-16">
      {/* Terminal Window */}
      <div className="w-full max-w-4xl">
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

              <div className="mt-6 flex gap-4">
                {mounted && isAuthenticated ? (
                  <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary inline-flex items-center gap-2">
                      Sign in
                    </Link>
                    <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                      Start your project →
                    </Link>
                  </>
                )}
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

        {/* Rest of your component remains the same... */}
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
