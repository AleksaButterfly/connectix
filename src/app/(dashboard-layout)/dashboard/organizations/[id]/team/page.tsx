'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { organizationService } from '@/lib/organizations/organization.service'
import { createClient } from '@/lib/supabase/client'
import type { Organization } from '@/types/organization'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface TeamMember {
  id: string
  username: string
  email: string
  role: 'owner' | 'admin' | 'member'
  mfaEnabled: boolean
  avatarUrl?: string | null
}

export default function OrganizationTeamPage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch organization
        const org = await organizationService.getOrganization(orgId)
        if (!org) {
          router.push('/dashboard/organizations')
          return
        }
        setOrganization(org)

        // Fetch current user
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, two_factor_enabled')
            .eq('id', user.id)
            .single()

          setCurrentUser({
            id: user.id,
            username:
              profile?.username ||
              user.email?.split('@')[0] ||
              intl.formatMessage({ id: 'common.unknown' }),
            email: user.email || '',
            role: 'owner', // For now, current user is always the owner
            mfaEnabled: profile?.two_factor_enabled || false,
            avatarUrl: user.user_metadata?.avatar_url || null,
          })
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        router.push('/dashboard/organizations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [orgId, router])

  // Get avatar initials (fallback when no avatar URL)
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get avatar color based on username (fallback when no avatar URL)
  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ]
    const index = username.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-8 w-8 animate-spin text-terminal-green"
            fill="none"
            viewBox="0 0 24 24"
          >
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
          <p className="text-foreground-muted">
            <FormattedMessage id="organization.team.loading" />
          </p>
        </div>
      </div>
    )
  }

  const filteredMembers =
    currentUser && currentUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      ? [currentUser]
      : []

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          <FormattedMessage id="organization.team.title" />
        </h1>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative max-w-xs flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={intl.formatMessage({ id: 'organization.team.filterPlaceholder' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background-secondary py-2 pl-10 pr-4 text-sm text-foreground placeholder-foreground-muted focus:border-terminal-green focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button disabled className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <FormattedMessage id="organization.team.invite" />
          </button>
          <button
            disabled
            className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FormattedMessage id="organization.team.leaveTeam" />
          </button>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="rounded-lg border border-border bg-background-secondary">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                <FormattedMessage id="organization.team.table.user" />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                <FormattedMessage id="organization.team.table.mfa" />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                <div className="flex items-center gap-2">
                  <FormattedMessage id="organization.team.table.role" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentUser && (searchQuery === '' || filteredMembers.length > 0) && (
              <tr className="border-b border-border last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${getAvatarColor(currentUser.username)} font-medium text-white`}
                      >
                        {getInitials(currentUser.username)}
                      </div>
                    )}
                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{currentUser.username}</p>
                        <span className="rounded-full bg-background-tertiary px-2 py-0.5 text-xs text-foreground-muted">
                          <FormattedMessage id="organization.team.you" />
                        </span>
                      </div>
                      <p className="text-sm text-foreground-muted">{currentUser.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {currentUser.mfaEnabled ? (
                    <svg
                      className="h-5 w-5 text-terminal-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-foreground-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-lg bg-terminal-green/10 px-2.5 py-1 text-sm font-medium text-terminal-green">
                    <FormattedMessage id="organization.team.role.owner" />
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Table Footer */}
        <div className="border-t border-border px-6 py-3">
          <p className="text-sm text-foreground-muted">
            <FormattedMessage
              id="organization.team.userCount"
              values={{
                count: searchQuery === '' ? 1 : filteredMembers.length,
                user: intl.formatMessage({
                  id:
                    (searchQuery === '' ? 1 : filteredMembers.length) === 1
                      ? 'common.user'
                      : 'common.users',
                }),
              }}
            />
          </p>
        </div>
      </div>
    </div>
  )
}
