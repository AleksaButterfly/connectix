'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function LandingPage() {
  const intl = useIntl()

  return (
    <div className="relative min-h-[calc(100vh-10rem)] px-4 py-16">
      <div className="mx-auto w-full max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            <FormattedMessage id="landing.hero.title" />{' '}
            <span className="text-terminal-green">
              <FormattedMessage id="landing.hero.titleHighlight" />
            </span>
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-lg text-foreground-muted">
            <FormattedMessage id="landing.hero.subtitle" />
          </p>
          <p className="mb-8 text-sm text-foreground-muted">
            <FormattedMessage id="landing.hero.tagline" />
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/organizations"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>
                <FormattedMessage id="landing.hero.cta.start" />
              </span>
              <span className="text-lg">→</span>
            </Link>
            <Link href="/" className="btn-secondary inline-flex items-center gap-2">
              <span>
                <FormattedMessage id="landing.hero.cta.demo" />
              </span>
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mb-12 flex flex-wrap justify-center gap-6 opacity-60">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>🔒</span>
            <span>
              <FormattedMessage id="landing.trust.soc2" />
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>🛡️</span>
            <span>
              <FormattedMessage id="landing.trust.encryption" />
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>🔐</span>
            <span>
              <FormattedMessage id="landing.trust.zeroKnowledge" />
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>✓</span>
            <span>
              <FormattedMessage id="landing.trust.gdpr" />
            </span>
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
            <div className="ml-4 text-xs text-foreground-subtle">
              <FormattedMessage id="landing.terminal.header" />
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            {/* Welcome Message */}
            <div className="space-y-4 text-foreground">
              <p className="text-terminal-green">
                <span className="text-foreground-muted">$</span>{' '}
                <FormattedMessage id="landing.terminal.helpCommand" />
              </p>

              <div className="ml-4 space-y-2">
                <p>
                  <FormattedMessage id="landing.terminal.title" />
                </p>
                <p className="text-foreground-muted">
                  <FormattedMessage id="landing.terminal.subtitle" />
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-terminal-green">
                  <span className="text-foreground-muted">$</span>{' '}
                  <FormattedMessage id="landing.terminal.featuresCommand" />
                </p>

                <ul className="ml-4 space-y-1 text-sm">
                  <li>
                    <span className="text-terminal-blue">[+]</span>{' '}
                    <FormattedMessage id="landing.terminal.features.integrated" />
                  </li>
                  <li>
                    <span className="text-terminal-purple">[+]</span>{' '}
                    <FormattedMessage id="landing.terminal.features.teamAccess" />
                  </li>
                  <li>
                    <span className="text-terminal-orange">[+]</span>{' '}
                    <FormattedMessage id="landing.terminal.features.multiProject" />
                  </li>
                  <li>
                    <span className="text-terminal-pink">[+]</span>{' '}
                    <FormattedMessage id="landing.terminal.features.collaboration" />
                  </li>
                  <li>
                    <span className="text-terminal-yellow">[+]</span>{' '}
                    <FormattedMessage id="landing.terminal.features.audit" />
                  </li>
                  <li>
                    <span className="text-terminal-green">[+]</span>{' '}
                    <FormattedMessage id="landing.terminal.features.credentials" />
                  </li>
                </ul>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <p className="text-terminal-green">
                  <span className="text-foreground-muted">$</span>{' '}
                  <FormattedMessage id="landing.terminal.startCommand" />
                </p>
                <span className="terminal-cursor"></span>
              </div>
            </div>

            {/* Status Line */}
            <div className="mt-8 border-t border-border pt-4">
              <p className="text-xs text-foreground-subtle">
                <span className="text-terminal-green">●</span>
                <span>
                  &nbsp;
                  <FormattedMessage id="landing.terminal.status" />
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Feature Cards */}
        <div className="mt-8 grid animate-slide-up gap-6 md:grid-cols-3">
          <FeatureCard
            icon="💻"
            title={intl.formatMessage({ id: 'landing.features.terminal.title' })}
            description={intl.formatMessage({ id: 'landing.features.terminal.description' })}
          />
          <FeatureCard
            icon="👥"
            title={intl.formatMessage({ id: 'landing.features.team.title' })}
            description={intl.formatMessage({ id: 'landing.features.team.description' })}
          />
          <FeatureCard
            icon="📁"
            title={intl.formatMessage({ id: 'landing.features.project.title' })}
            description={intl.formatMessage({ id: 'landing.features.project.description' })}
          />
        </div>

        {/* Social Proof Section */}
        <div className="mt-16 animate-slide-up text-center">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-terminal-green">
                <FormattedMessage id="landing.stats.teams.value" />
              </div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="landing.stats.teams.label" />
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-blue">
                <FormattedMessage id="landing.stats.servers.value" />
              </div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="landing.stats.servers.label" />
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-purple">
                <FormattedMessage id="landing.stats.uptime.value" />
              </div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="landing.stats.uptime.label" />
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-terminal-orange">
                <FormattedMessage id="landing.stats.support.value" />
              </div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="landing.stats.support.label" />
              </p>
            </div>
          </div>
        </div>

        {/* Why Connectix Section */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            <FormattedMessage id="landing.comparison.title" />
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="mb-4 font-bold text-red-400">
                ❌ <FormattedMessage id="landing.comparison.old.title" />
              </h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>
                  • <FormattedMessage id="landing.comparison.old.item1" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.old.item2" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.old.item3" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.old.item4" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.old.item5" />
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-terminal-green/20 bg-terminal-green/5 p-6">
              <h3 className="mb-4 font-bold text-terminal-green">
                ✓ <FormattedMessage id="landing.comparison.new.title" />
              </h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>
                  • <FormattedMessage id="landing.comparison.new.item1" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.new.item2" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.new.item3" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.new.item4" />
                </li>
                <li>
                  • <FormattedMessage id="landing.comparison.new.item5" />
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Features Section */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            <FormattedMessage id="landing.detailedFeatures.title" />
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailedFeatureCard
              title={intl.formatMessage({ id: 'landing.detailedFeatures.terminal.title' })}
              features={[
                intl.formatMessage({ id: 'landing.detailedFeatures.terminal.item1' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.terminal.item2' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.terminal.item3' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.terminal.item4' }),
              ]}
            />
            <DetailedFeatureCard
              title={intl.formatMessage({ id: 'landing.detailedFeatures.files.title' })}
              features={[
                intl.formatMessage({ id: 'landing.detailedFeatures.files.item1' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.files.item2' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.files.item3' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.files.item4' }),
              ]}
            />
            <DetailedFeatureCard
              title={intl.formatMessage({ id: 'landing.detailedFeatures.access.title' })}
              features={[
                intl.formatMessage({ id: 'landing.detailedFeatures.access.item1' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.access.item2' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.access.item3' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.access.item4' }),
              ]}
            />
            <DetailedFeatureCard
              title={intl.formatMessage({ id: 'landing.detailedFeatures.audit.title' })}
              features={[
                intl.formatMessage({ id: 'landing.detailedFeatures.audit.item1' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.audit.item2' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.audit.item3' }),
                intl.formatMessage({ id: 'landing.detailedFeatures.audit.item4' }),
              ]}
            />
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            <FormattedMessage id="landing.useCases.title" />
          </h2>

          <div className="grid gap-4">
            <UseCase
              role={intl.formatMessage({ id: 'landing.useCases.dev.role' })}
              description={intl.formatMessage({ id: 'landing.useCases.dev.description' })}
              details={[
                intl.formatMessage({ id: 'landing.useCases.dev.detail1' }),
                intl.formatMessage({ id: 'landing.useCases.dev.detail2' }),
                intl.formatMessage({ id: 'landing.useCases.dev.detail3' }),
                intl.formatMessage({ id: 'landing.useCases.dev.detail4' }),
              ]}
            />
            <UseCase
              role={intl.formatMessage({ id: 'landing.useCases.agencies.role' })}
              description={intl.formatMessage({ id: 'landing.useCases.agencies.description' })}
              details={[
                intl.formatMessage({ id: 'landing.useCases.agencies.detail1' }),
                intl.formatMessage({ id: 'landing.useCases.agencies.detail2' }),
                intl.formatMessage({ id: 'landing.useCases.agencies.detail3' }),
                intl.formatMessage({ id: 'landing.useCases.agencies.detail4' }),
              ]}
            />
            <UseCase
              role={intl.formatMessage({ id: 'landing.useCases.devops.role' })}
              description={intl.formatMessage({ id: 'landing.useCases.devops.description' })}
              details={[
                intl.formatMessage({ id: 'landing.useCases.devops.detail1' }),
                intl.formatMessage({ id: 'landing.useCases.devops.detail2' }),
                intl.formatMessage({ id: 'landing.useCases.devops.detail3' }),
                intl.formatMessage({ id: 'landing.useCases.devops.detail4' }),
              ]}
            />
            <UseCase
              role={intl.formatMessage({ id: 'landing.useCases.startups.role' })}
              description={intl.formatMessage({ id: 'landing.useCases.startups.description' })}
              details={[
                intl.formatMessage({ id: 'landing.useCases.startups.detail1' }),
                intl.formatMessage({ id: 'landing.useCases.startups.detail2' }),
                intl.formatMessage({ id: 'landing.useCases.startups.detail3' }),
                intl.formatMessage({ id: 'landing.useCases.startups.detail4' }),
              ]}
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 animate-slide-up">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            <FormattedMessage id="landing.faq.title" />
          </h2>
          <div className="space-y-4">
            <FAQItem
              question={intl.formatMessage({ id: 'landing.faq.security.question' })}
              answer={intl.formatMessage({ id: 'landing.faq.security.answer' })}
            />
            <FAQItem
              question={intl.formatMessage({ id: 'landing.faq.selfHost.question' })}
              answer={intl.formatMessage({ id: 'landing.faq.selfHost.answer' })}
            />
            <FAQItem
              question={intl.formatMessage({ id: 'landing.faq.pricing.question' })}
              answer={intl.formatMessage({ id: 'landing.faq.pricing.answer' })}
            />
            <FAQItem
              question={intl.formatMessage({ id: 'landing.faq.migration.question' })}
              answer={intl.formatMessage({ id: 'landing.faq.migration.answer' })}
            />
            <FAQItem
              question={intl.formatMessage({ id: 'landing.faq.os.question' })}
              answer={intl.formatMessage({ id: 'landing.faq.os.answer' })}
            />
            <FAQItem
              question={intl.formatMessage({ id: 'landing.faq.api.question' })}
              answer={intl.formatMessage({ id: 'landing.faq.api.answer' })}
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 animate-slide-up">
          <div className="rounded-lg border-2 border-terminal-green bg-terminal-green/10 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              <FormattedMessage id="landing.cta.title" />
            </h2>
            <p className="mb-8 text-lg text-foreground-muted">
              <FormattedMessage id="landing.cta.subtitle" />
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard/organizations"
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg"
              >
                <span>
                  <FormattedMessage id="landing.cta.button.start" />
                </span>
                <span>→</span>
              </Link>
              <Link
                href="/pricing"
                className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-lg"
              >
                <span>
                  <FormattedMessage id="landing.cta.button.pricing" />
                </span>
              </Link>
            </div>
            <div className="mt-6 text-sm text-foreground-muted">
              <p>
                ✓ <FormattedMessage id="landing.cta.benefit1" />
              </p>
              <p>
                ✓ <FormattedMessage id="landing.cta.benefit2" />
              </p>
              <p>
                ✓ <FormattedMessage id="landing.cta.benefit3" />
              </p>
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
