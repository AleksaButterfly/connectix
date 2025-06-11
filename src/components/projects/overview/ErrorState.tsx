'use client'

import { FormattedMessage } from '@/lib/i18n'
import { Button } from '@/components/ui'

interface ErrorStateProps {
  error?: string
  onRetry: () => void
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">
            {error || <FormattedMessage id="projects.error.notFound" />}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            <FormattedMessage id="common.tryAgain" />
          </Button>
        </div>
      </div>
    </div>
  )
}