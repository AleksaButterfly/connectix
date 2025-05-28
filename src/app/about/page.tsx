'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<'mission' | 'security' | 'team'>('mission')

  return (
    <div className="relative min-h-[calc(100vh-10rem)] px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-16 animate-fade-in text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            About <span className="text-terminal-green">Connectix</span>
          </h1>
          <p className="text-lg text-foreground-muted">
            Revolutionizing server management for modern development teams
          </p>
        </div>

        {/* Terminal Story */}
        <div className="terminal-window mb-16 animate-slide-up">
          <div className="terminal-header">
            <div className="flex gap-1.5">
              <div className="terminal-dot bg-terminal-red" />
              <div className="terminal-dot bg-terminal-yellow" />
              <div className="terminal-dot bg-terminal-green" />
            </div>
            <div className="ml-4 text-xs text-foreground-subtle">our-story.md</div>
          </div>
          <div className="p-6 font-mono text-sm">
            <p className="mb-4 text-terminal-green"># The Problem</p>
            <p className="mb-6 text-foreground">
              Every developer knows the pain: juggling SSH keys, switching between terminal and file
              managers, sharing credentials over Slack, and the constant fear of "who has access to
              what?"
            </p>

            <p className="mb-4 text-terminal-green"># Our Solution</p>
            <p className="mb-6 text-foreground">
              Connectix brings together terminal access, file management, and team collaboration in
              one secure platform. No more context switching. No more credential sharing. Just
              seamless server management.
            </p>

            <p className="mb-4 text-terminal-green"># Why We Built This</p>
            <p className="text-foreground">
              Because we've been there. Late nights debugging production, onboarding new developers,
              managing client servers. We built Connectix to be the tool we wished we had.
            </p>
          </div>
        </div>

        {/* Interactive Tabs */}
        <div className="mb-16 animate-slide-up">
          <div className="mb-6 flex gap-2 rounded-lg border border-border bg-background-secondary p-1">
            <button
              onClick={() => setActiveTab('mission')}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'mission'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Our Mission
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Security First
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'team'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Built for Teams
            </button>
          </div>

          <div className="rounded-lg border border-border bg-background-secondary p-6">
            {activeTab === 'mission' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  Empowering Developers Worldwide
                </h3>
                <p className="text-foreground-muted">
                  Our mission is to eliminate the friction in server management. We believe
                  developers should focus on building great products, not wrestling with
                  infrastructure access.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      Streamline workflows for 10,000+ dev teams by 2025
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      Make secure server access as simple as opening a browser
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      Build the infrastructure tool we wish existed
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Security is Not Optional</h3>
                <p className="text-foreground-muted">
                  We handle your most sensitive infrastructure access. That's why security isn't
                  just a feature—it's the foundation of everything we build.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SecurityFeature
                    icon="🔐"
                    title="Zero-Knowledge Architecture"
                    description="Credentials encrypted end-to-end, never stored"
                  />
                  <SecurityFeature
                    icon="🛡️"
                    title="SOC2 Compliant"
                    description="Enterprise-grade security standards"
                  />
                  <SecurityFeature
                    icon="📝"
                    title="Complete Audit Trail"
                    description="Every action logged and traceable"
                  />
                  <SecurityFeature
                    icon="🔑"
                    title="Multi-Factor Auth"
                    description="Hardware key and biometric support"
                  />
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  Collaboration Without Compromise
                </h3>
                <p className="text-foreground-muted">
                  Teams shouldn't have to choose between security and productivity. Connectix gives
                  you both.
                </p>
                <div className="space-y-3">
                  <TeamFeature
                    title="Granular Permissions"
                    description="Control access down to individual files and commands"
                  />
                  <TeamFeature
                    title="Real-time Collaboration"
                    description="See who's working on what, when they're doing it"
                  />
                  <TeamFeature
                    title="Project Organization"
                    description="Keep client work separate, environments isolated"
                  />
                  <TeamFeature
                    title="Instant Onboarding"
                    description="New team members productive in minutes, not days"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Stats */}
        <div className="mb-16 grid animate-slide-up gap-6 sm:grid-cols-3">
          <StatCard number="<100ms" label="Average connection time" color="text-terminal-green" />
          <StatCard number="99.9%" label="Uptime guarantee" color="text-terminal-blue" />
          <StatCard number="256-bit" label="AES encryption" color="text-terminal-purple" />
        </div>

        {/* CTA Section */}
        <div className="animate-slide-up text-center">
          <div className="rounded-lg border border-terminal-green/50 bg-terminal-green/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Ready to transform your workflow?
            </h2>
            <p className="mb-6 text-foreground-muted">
              Join thousands of developers who've already made the switch to smarter server
              management.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                <span>Start Free Trial</span>
                <span className="text-lg">→</span>
              </Link>
              <Link href="/docs" className="btn-secondary inline-flex items-center gap-2">
                <span>Read the Docs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityFeature({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background-tertiary p-4">
      <div className="mb-2 text-2xl">{icon}</div>
      <h4 className="mb-1 font-medium text-foreground">{title}</h4>
      <p className="text-xs text-foreground-muted">{description}</p>
    </div>
  )
}

function TeamFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2 w-2 rounded-full bg-terminal-green" />
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
    </div>
  )
}

function StatCard({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-background-secondary p-6 text-center">
      <div className={`mb-2 text-3xl font-bold ${color}`}>{number}</div>
      <p className="text-sm text-foreground-muted">{label}</p>
    </div>
  )
}
