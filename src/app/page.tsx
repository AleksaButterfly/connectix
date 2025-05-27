import Link from 'next/link'

export default function LandingPage() {
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
                <p>Connectix - Secure SSH File Manager for Developers</p>
                <p className="text-foreground-muted">
                  Browse, upload, download, and manage files on remote servers directly from your
                  browser.
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-terminal-green">
                  <span className="text-foreground-muted">$</span> ./connectix --features
                </p>

                <ul className="ml-4 space-y-1 text-sm">
                  <li>
                    <span className="text-terminal-blue">[+]</span> Secure SSH/SFTP connections
                  </li>
                  <li>
                    <span className="text-terminal-purple">[+]</span> Password & private key
                    authentication
                  </li>
                  <li>
                    <span className="text-terminal-orange">[+]</span> Real-time file operations
                  </li>
                  <li>
                    <span className="text-terminal-pink">[+]</span> Multi-server management
                  </li>
                  <li>
                    <span className="text-terminal-yellow">[+]</span> Terminal-inspired UI
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
                <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                  <span>Get Started</span>
                  <span className="text-lg">→</span>
                </Link>
                <Link href="/login" className="btn-secondary inline-flex items-center gap-2">
                  <span>Sign In</span>
                </Link>
              </div>
            </div>

            {/* Status Line */}
            <div className="mt-8 border-t border-border pt-4">
              <p className="text-xs text-foreground-subtle">
                <span className="text-terminal-green">●</span>
                <span>&nbsp;System ready | Version 1.0.0 | Secure connection required</span>
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-8 grid animate-slide-up gap-6 md:grid-cols-3">
          <FeatureCard
            icon="🔐"
            title="Secure by Design"
            description="End-to-end encryption with SSH protocol. Your credentials never leave your session."
          />
          <FeatureCard
            icon="⚡"
            title="Lightning Fast"
            description="Optimized for speed with streaming downloads and efficient file operations."
          />
          <FeatureCard
            icon="🛠️"
            title="Developer First"
            description="Built by developers, for developers. Clean UI with powerful features."
          />
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
