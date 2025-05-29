export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-terminal-green border-t-transparent"></div>
        </div>
        <p className="text-foreground-muted">Initializing secure connection...</p>
      </div>
    </div>
  )
}
