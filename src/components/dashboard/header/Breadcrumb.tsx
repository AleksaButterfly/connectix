'use client'

import Link from 'next/link'
import { FormattedMessage } from '@/lib/i18n'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export interface BreadcrumbItem {
  label: string
  labelId?: string // For i18n translation keys
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav className={cn('flex items-center text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <Icon
              name="chevronRight"
              className="mx-3 text-foreground-muted"
              size="sm"
            />
          )}

          {item.href && (index > 0 || !item.icon) ? (
            <Link
              href={item.href}
              className="flex items-center gap-2 rounded-md p-1 text-foreground transition-colors hover:bg-background-secondary"
            >
              {item.icon}
              <span className="font-medium">
                {item.labelId ? (
                  <FormattedMessage id={item.labelId} defaultMessage={item.label} />
                ) : (
                  item.label
                )}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 rounded-md p-1 text-foreground">
              {item.icon}
              {(index > 0 || !item.icon) && (
                <span className="font-medium">
                  {item.labelId ? (
                    <FormattedMessage id={item.labelId} defaultMessage={item.label} />
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

export { Breadcrumb }