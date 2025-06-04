interface FileBreadcrumbProps {
  path: string
  onNavigate: (path: string) => void
}

export function FileBreadcrumb({ path, onNavigate }: FileBreadcrumbProps) {
  const segments = path.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-sm">
      <button
        onClick={() => onNavigate('/')}
        className="hover:text-terminal-green-hover text-terminal-green"
      >
        /
      </button>

      {segments.map((segment, index) => {
        const segmentPath = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1

        return (
          <div key={segmentPath} className="flex items-center gap-1">
            <span className="text-foreground-muted">/</span>
            {isLast ? (
              <span className="text-foreground">{segment}</span>
            ) : (
              <button
                onClick={() => onNavigate(segmentPath)}
                className="hover:text-terminal-green-hover text-terminal-green"
              >
                {segment}
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}
