'use client'

import { IntlProvider } from 'react-intl'
import { ReactNode } from 'react'
import enMessages from './messages/en.json'

const messages = {
  en: enMessages,
}

interface I18nProviderProps {
  children: ReactNode
  locale?: string
}

export function I18nProvider({ children, locale = 'en' }: I18nProviderProps) {
  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale as keyof typeof messages]}
      defaultLocale="en"
      onError={(err) => {
        if (err.code === 'MISSING_TRANSLATION') {
          console.warn('Missing translation', err.message)
          return
        }
        throw err
      }}
    >
      {children}
    </IntlProvider>
  )
}
