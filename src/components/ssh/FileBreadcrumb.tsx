interface FileBreadcrumbProps {
  path: string
  onNavigate: (path: string) => void
}

export function FileBreadcrumb({ path, onNavigate }: FileBreadcrumbProps) {
  const segments = path.split('/').filter(Boolean)

  // If we're at root, just show root
  if (segments.length === 0) {
    return (
      <nav className="flex items-center text-sm">
        <span className="text-foreground">/</span>
      </nav>
    )
  }

  // Build breadcrumb items as a flat array
  const breadcrumbItems = []

  // Add root
  breadcrumbItems.push(
    <button
      key="root"
      onClick={() => onNavigate('/')}
      className="hover:text-terminal-green-hover text-terminal-green"
    >
      /
    </button>
  )

  // Add each segment
  segments.forEach((segment, index) => {
    const segmentPath = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1

    // Only add separator for segments after the first one
    if (index > 0) {
      breadcrumbItems.push(
        <span key={`sep-${index}`} className="text-foreground-muted">
          /
        </span>
      )
    }

    // Add segment
    if (isLast) {
      breadcrumbItems.push(
        <span key={segmentPath} className="text-foreground">
          {segment}
        </span>
      )
    } else {
      breadcrumbItems.push(
        <button
          key={segmentPath}
          onClick={() => onNavigate(segmentPath)}
          className="hover:text-terminal-green-hover text-terminal-green"
        >
          {segment}
        </button>
      )
    }
  })

  return <nav className="flex items-center gap-2 text-sm">{breadcrumbItems}</nav>
}
