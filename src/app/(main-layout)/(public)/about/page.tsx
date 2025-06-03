'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function AboutPage() {
  const intl = useIntl()
  const [activeTab, setActiveTab] = useState<'mission' | 'security' | 'team'>('mission')

  return (
    <div className="relative min-h-[calc(100vh-10rem)] px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-16 animate-fade-in text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            <FormattedMessage id="about.hero.title" />{' '}
            <span className="text-terminal-green">Connectix</span>
          </h1>
          <p className="text-lg text-foreground-muted">
            <FormattedMessage id="about.hero.subtitle" />
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
            <p className="mb-4 text-terminal-green">
              # <FormattedMessage id="about.story.problem.title" />
            </p>
            <p className="mb-6 text-foreground">
              <FormattedMessage id="about.story.problem.description" />
            </p>

            <p className="mb-4 text-terminal-green">
              # <FormattedMessage id="about.story.solution.title" />
            </p>
            <p className="mb-6 text-foreground">
              <FormattedMessage id="about.story.solution.description" />
            </p>

            <p className="mb-4 text-terminal-green">
              # <FormattedMessage id="about.story.different.title" />
            </p>
            <p className="text-foreground">
              <FormattedMessage id="about.story.different.description" />
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
              <FormattedMessage id="about.tabs.mission" />
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FormattedMessage id="about.tabs.security" />
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'team'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FormattedMessage id="about.tabs.team" />
            </button>
          </div>

          <div className="rounded-lg border border-border bg-background-secondary p-6">
            {activeTab === 'mission' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  <FormattedMessage id="about.mission.title" />
                </h3>
                <p className="text-foreground-muted">
                  <FormattedMessage id="about.mission.description" />
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      <FormattedMessage id="about.mission.point1" />
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      <FormattedMessage id="about.mission.point2" />
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-terminal-green">→</span>
                    <span className="text-foreground-muted">
                      <FormattedMessage id="about.mission.point3" />
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  <FormattedMessage id="about.security.title" />
                </h3>
                <p className="text-foreground-muted">
                  <FormattedMessage id="about.security.description" />
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SecurityFeature
                    icon="🔐"
                    title={intl.formatMessage({ id: 'about.security.feature1.title' })}
                    description={intl.formatMessage({ id: 'about.security.feature1.description' })}
                  />
                  <SecurityFeature
                    icon="🛡️"
                    title={intl.formatMessage({ id: 'about.security.feature2.title' })}
                    description={intl.formatMessage({ id: 'about.security.feature2.description' })}
                  />
                  <SecurityFeature
                    icon="📝"
                    title={intl.formatMessage({ id: 'about.security.feature3.title' })}
                    description={intl.formatMessage({ id: 'about.security.feature3.description' })}
                  />
                  <SecurityFeature
                    icon="🔑"
                    title={intl.formatMessage({ id: 'about.security.feature4.title' })}
                    description={intl.formatMessage({ id: 'about.security.feature4.description' })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  <FormattedMessage id="about.team.title" />
                </h3>
                <p className="text-foreground-muted">
                  <FormattedMessage id="about.team.description" />
                </p>
                <div className="space-y-3">
                  <TeamFeature
                    title={intl.formatMessage({ id: 'about.team.feature1.title' })}
                    description={intl.formatMessage({ id: 'about.team.feature1.description' })}
                  />
                  <TeamFeature
                    title={intl.formatMessage({ id: 'about.team.feature2.title' })}
                    description={intl.formatMessage({ id: 'about.team.feature2.description' })}
                  />
                  <TeamFeature
                    title={intl.formatMessage({ id: 'about.team.feature3.title' })}
                    description={intl.formatMessage({ id: 'about.team.feature3.description' })}
                  />
                  <TeamFeature
                    title={intl.formatMessage({ id: 'about.team.feature4.title' })}
                    description={intl.formatMessage({ id: 'about.team.feature4.description' })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Stats */}
        <div className="mb-16 grid animate-slide-up gap-6 sm:grid-cols-3">
          <StatCard
            number={intl.formatMessage({ id: 'about.stats.teams.value' })}
            label={intl.formatMessage({ id: 'about.stats.teams.label' })}
            color="text-terminal-green"
          />
          <StatCard
            number={intl.formatMessage({ id: 'about.stats.servers.value' })}
            label={intl.formatMessage({ id: 'about.stats.servers.label' })}
            color="text-terminal-blue"
          />
          <StatCard
            number={intl.formatMessage({ id: 'about.stats.uptime.value' })}
            label={intl.formatMessage({ id: 'about.stats.uptime.label' })}
            color="text-terminal-purple"
          />
        </div>

        {/* Company Values */}
        <div className="mb-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            <FormattedMessage id="about.values.title" />
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <ValueCard
              icon="🔒"
              title={intl.formatMessage({ id: 'about.values.security.title' })}
              description={intl.formatMessage({ id: 'about.values.security.description' })}
            />
            <ValueCard
              icon="⚡"
              title={intl.formatMessage({ id: 'about.values.experience.title' })}
              description={intl.formatMessage({ id: 'about.values.experience.description' })}
            />
            <ValueCard
              icon="🤝"
              title={intl.formatMessage({ id: 'about.values.transparent.title' })}
              description={intl.formatMessage({ id: 'about.values.transparent.description' })}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="animate-slide-up text-center">
          <div className="rounded-lg border border-terminal-green/50 bg-terminal-green/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              <FormattedMessage id="about.cta.title" />
            </h2>
            <p className="mb-6 text-foreground-muted">
              <FormattedMessage id="about.cta.subtitle" />
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard/organizations"
                className="btn-primary inline-flex items-center gap-2"
              >
                <span>
                  <FormattedMessage id="about.cta.button.start" />
                </span>
                <span className="text-lg">→</span>
              </Link>
              <Link href="/" className="btn-secondary inline-flex items-center gap-2">
                <span>
                  <FormattedMessage id="about.cta.button.demo" />
                </span>
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
