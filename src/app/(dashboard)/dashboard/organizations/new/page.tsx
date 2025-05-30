'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { organizationService } from '@/lib/organizations/organization.service'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Organization name is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const org = await organizationService.createOrganization(name.trim())
      // Redirect to the new organization page using ID
      router.push(`/dashboard/organizations/${org.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create organization')
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/organizations"
          className="mb-4 inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to organizations
        </Link>

        <h1 className="text-3xl font-bold text-foreground">New organization</h1>
      </div>

      <div className="rounded-lg border border-border bg-background-secondary p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Create a new organization</h2>
          <p className="text-sm text-foreground-muted">
            This is your organization within Connectix.
            <br />
            For example, you can use the name of your company or department.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-foreground-muted transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-terminal-green"
              disabled={isLoading}
              autoFocus
            />
            <p className="mt-2 text-sm text-foreground-muted">
              You can rename your organization later
            </p>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/organizations"
              className="px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
