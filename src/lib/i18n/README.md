# Internationalization (i18n) Guide

This folder contains all internationalization configurations and translations for the Connectix application using React Intl.

## 📁 Folder Structure

```
lib/i18n/
├── index.ts          # Main exports and re-exports from react-intl
├── provider.tsx      # IntlProvider wrapper component
├── messages/
│   └── en.json      # English translations (default)
└── README.md        # This file
```

## 🚀 Quick Start

### Using Translations in Components

1. **Import the necessary functions:**

```tsx
import { useIntl, FormattedMessage } from '@/lib/i18n'
```

2. **For simple text replacement:**

```tsx
<FormattedMessage id="common.save" />
```

3. **For text in props, placeholders, or programmatic use:**

```tsx
const intl = useIntl()

<input
  placeholder={intl.formatMessage({ id: 'auth.login.emailPlaceholder' })}
/>
```

## 📝 Translation Key Naming Convention

We follow a hierarchical naming pattern that mirrors the application structure:

### Pattern: `[page/section].[subsection].[element].[property]`

### Examples:

- **Page-specific:** `landing.hero.title`, `auth.login.subtitle`
- **Common/shared:** `common.save`, `common.cancel`, `common.loading`
- **Navigation:** `navigation.dashboard`, `navigation.signOut`
- **Validation:** `validation.email.invalid`, `validation.password.required`
- **Component-specific:** `userMenu.accountSettings`, `footer.company.about`

### Page Prefixes:

| Prefix           | Usage                                        |
| ---------------- | -------------------------------------------- |
| `landing.*`      | Landing page content                         |
| `about.*`        | About page content                           |
| `auth.*`         | Authentication pages (login, register, etc.) |
| `dashboard.*`    | Dashboard-related content                    |
| `organization.*` | Organization pages content                   |
| `account.*`      | Account settings pages                       |
| `audit.*`        | Audit logs page                              |
| `navigation.*`   | Header/navigation items                      |
| `footer.*`       | Footer content                               |
| `common.*`       | Shared across multiple pages                 |
| `validation.*`   | Form validation messages                     |

## 💡 Best Practices

### 1. **Component Setup**

Always add `'use client'` directive for components using React Intl:

```tsx
'use client'

import { useIntl, FormattedMessage } from '@/lib/i18n'
```

### 2. **Dynamic Values**

Use interpolation for dynamic content:

```tsx
<FormattedMessage id="organization.createdDate" values={{ date: createdDate }} />
```

Translation: `"organization.createdDate": "Created {date}"`

### 3. **Pluralization**

Handle plurals properly:

```tsx
<FormattedMessage
  id="organizations.projectCount"
  values={{
    count: projectsCount,
    projects: intl.formatMessage({
      id: projectsCount === 1 ? 'common.project' : 'common.projects',
    }),
  }}
/>
```

### 4. **Rich Text Formatting**

Embed React components within translations:

```tsx
<FormattedMessage
  id="auth.register.terms"
  values={{
    terms: <Link href="/terms">Terms of Service</Link>,
    privacy: <Link href="/privacy">Privacy Policy</Link>,
  }}
/>
```

Translation: `"auth.register.terms": "I agree to the {terms} and {privacy}"`

### 5. **Form Validation with Zod**

Make validation messages translatable:

```tsx
const schema = z.object({
  email: z.string().email(intl.formatMessage({ id: 'validation.email.invalid' })),
  username: z.string().min(3, intl.formatMessage({ id: 'validation.username.minLength' })),
})
```

### 6. **Conditional Messages**

For OAuth providers or conditional content:

```tsx
const providerName = provider === 'github' ? 'GitHub' : 'Google'
<FormattedMessage
  id="account.settings.oauthEmail"
  values={{ provider: providerName }}
/>
```

## 📋 Common Patterns

### Simple Text

```tsx
// Component usage
<FormattedMessage id="common.save" />

// Translation
"common.save": "Save"
```

### With Variables

```tsx
// Component usage
<FormattedMessage
  id="audit.showingResults"
  values={{ shown: 10, total: 50 }}
/>

// Translation
"audit.showingResults": "Showing {shown} of {total} results"
```

### In Attributes

```tsx
// Component usage
const intl = useIntl()
<button
  title={intl.formatMessage({ id: 'common.delete' })}
  aria-label={intl.formatMessage({ id: 'common.delete' })}
>

// Translation
"common.delete": "Delete"
```

### Error Messages

```tsx
// Component usage
toast.error(intl.formatMessage({ id: 'organization.settings.saveError' }))

// Translation
"organization.settings.saveError": "Failed to update organization"
```

## 🌍 Adding New Languages

1. Create a new translation file in `messages/` folder:

```
messages/
├── en.json
├── es.json  # Spanish
├── fr.json  # French
└── de.json  # German
```

2. Update the provider to include new languages:

```tsx
// provider.tsx
const messages = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  de: deMessages,
}
```

3. Copy `en.json` and translate all values to the new language

## ⚠️ Important Notes

1. **Never hardcode user-facing text** - Always use translation keys
2. **Keep keys consistent** - Follow the naming convention
3. **Avoid deep nesting** - Maximum 3-4 levels for readability
4. **Group related translations** - Keep page/feature translations together
5. **Don't translate:**
   - User-generated content (usernames, organization names)
   - Technical identifiers (IDs, slugs)
   - Brand names (Connectix, GitHub, Google)
   - Terminal commands (`$ ssh connectix@login`)

## 🔍 Finding Translation Keys

To find where a translation key is used:

1. Search for the key in your codebase (e.g., `"landing.hero.title"`)
2. Keys typically match the file structure:
   - `landing.*` → `/app/(main-layout)/(public)/page.tsx`
   - `auth.login.*` → `/app/(main-layout)/(public)/(auth)/login/page.tsx`
   - `organization.team.*` → `/app/(dashboard-layout)/dashboard/organizations/[id]/team/page.tsx`

## 🧪 Testing Translations

1. **Check for missing translations** in the browser console
2. **Test with longer text** to ensure UI doesn't break
3. **Verify dynamic values** are properly interpolated
4. **Test pluralization** with different counts (0, 1, many)

## 📚 Resources

- [React Intl Documentation](https://formatjs.io/docs/react-intl/)
- [FormatJS Message Syntax](https://formatjs.io/docs/core-concepts/icu-syntax/)
- [Internationalization Best Practices](https://formatjs.io/docs/best-practices/)
