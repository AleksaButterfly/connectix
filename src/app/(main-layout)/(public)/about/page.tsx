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
            The complete SSH management platform for modern development teams
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
              Every team faces the same challenges: Terminal apps, SFTP clients, and password
              managers scattered across devices. SSH keys shared through Slack. No visibility into
              who accessed what. Hours spent onboarding new developers. We knew there had to be a
              better way.
            </p>

            <p className="mb-4 text-terminal-green"># Our Solution</p>
            <p className="mb-6 text-foreground">
              Connectix unifies terminal access, file management, and team collaboration in one
              secure, browser-based platform. With end-to-end encryption, granular permissions, and
              complete audit trails, we've reimagined how teams manage server access.
            </p>

            <p className="mb-4 text-terminal-green"># Why We're Different</p>
            <p className="text-foreground">
              Built by developers, for developers. We've experienced the pain firsthand - that's why
              Connectix focuses on what matters: security without sacrificing speed, collaboration
              without compromising control, and simplicity without limiting power.
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
                  Empowering 500+ Teams Worldwide
                </h3>
                <p className="text-foreground-muted">
                  Our mission is simple: make server management so secure and intuitive that teams
                  can focus on what they do best - building great products. No more juggling tools,
                  no more security nightmares, just seamless collaboration.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      Replace multiple tools with one unified platform
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      Onboard developers in under 5 minutes, not hours
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      Provide enterprise-grade security for teams of all sizes
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Security is Our Foundation</h3>
                <p className="text-foreground-muted">
                  Managing 10,000+ servers across 500+ teams means security isn't optional - it's
                  everything. That's why we've built Connectix with zero-trust architecture from day
                  one.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SecurityFeature
                    icon="🔐"
                    title="Zero-Knowledge Architecture"
                    description="Your credentials never touch our servers in plain text"
                  />
                  <SecurityFeature
                    icon="🛡️"
                    title="SOC2 Type II Compliant"
                    description="Audited and certified for enterprise use"
                  />
                  <SecurityFeature
                    icon="📝"
                    title="Complete Audit Trail"
                    description="Every command, file change, and access logged"
                  />
                  <SecurityFeature
                    icon="🔑"
                    title="Advanced Authentication"
                    description="SSO, 2FA, hardware keys, and biometric support"
                  />
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Collaboration at Scale</h3>
                <p className="text-foreground-muted">
                  From startups to enterprises, development teams to agencies - Connectix adapts to
                  how you work, not the other way around. Real-time collaboration meets granular
                  control.
                </p>
                <div className="space-y-3">
                  <TeamFeature
                    title="Role-Based Access Control"
                    description="Define permissions by folder, command, or time. Perfect for contractors and junior developers."
                  />
                  <TeamFeature
                    title="Real-Time Activity Monitoring"
                    description="See who's accessing what in real-time. Get alerts for sensitive operations."
                  />
                  <TeamFeature
                    title="Project-Based Organization"
                    description="Separate clients, environments, and teams. Switch contexts instantly."
                  />
                  <TeamFeature
                    title="5-Minute Onboarding"
                    description="Add team members and they're productive immediately. Revoke access just as fast."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Stats */}
        <div className="mb-16 grid animate-slide-up gap-6 sm:grid-cols-3">
          <StatCard number="500+" label="Active teams" color="text-terminal-green" />
          <StatCard number="10k+" label="Servers managed" color="text-terminal-blue" />
          <StatCard number="99.9%" label="Uptime SLA" color="text-terminal-purple" />
        </div>

        {/* Company Values */}
        <div className="mb-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Our Core Values</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <ValueCard
              icon="🔒"
              title="Security First"
              description="Every feature, every line of code starts with security. Your infrastructure is too important for compromises."
            />
            <ValueCard
              icon="⚡"
              title="Developer Experience"
              description="Built by developers who feel your pain. If it's not faster than your current workflow, we've failed."
            />
            <ValueCard
              icon="🤝"
              title="Transparent & Fair"
              description="No hidden fees, no vendor lock-in. Export your data anytime. Self-host if you need to."
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="animate-slide-up text-center">
          <div className="rounded-lg border border-terminal-green/50 bg-terminal-green/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Ready to join 500+ teams already using Connectix?
            </h2>
            <p className="mb-6 text-foreground-muted">
              Start managing your servers the modern way. Free for up to 3 team members.
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

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background-secondary p-6 text-center">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 font-bold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-muted">{description}</p>
    </div>
  )
}
