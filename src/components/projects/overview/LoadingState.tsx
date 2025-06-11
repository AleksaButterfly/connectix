'use client'

import { FormattedMessage } from '@/lib/i18n'
import { LoadingSpinner } from '@/components/ui'

export const LoadingState = () => {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-foreground-muted">
          <FormattedMessage id="projects.overview.loading" />
        </p>
      </div>
    </div>
  )
}