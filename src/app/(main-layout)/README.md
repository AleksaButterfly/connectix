# Main Layout Route Group

This route group `(main-layout)` contains all pages that use the marketing/public-facing layout with the main navigation header and footer.

## Layout Structure

The main layout (`layout.tsx`) provides:

- Marketing-style header with public navigation
- Footer with company information and links
- Consistent styling for public-facing pages
- No sidebar or dashboard navigation

## Route Organization

### `(public)` - Publicly Accessible Routes

Routes that don't require authentication:

- `/` - Landing page
- `/about` - About page
- `/auth/callback` - OAuth callback handler
- `/(auth)/*` - Authentication forms:
  - `/login` - User login
  - `/register` - User registration
  - `/forgot-password` - Password reset request
  - `/reset-password` - Password reset form
  - `/verify-email` - Email verification

### `(protected)` - Protected Routes with Main Layout

Routes that require authentication but use the marketing layout:

- `/account/settings` - User account settings
- `/account/audit` - Account audit logs

## Why This Structure?

1. **Shared Layout**: Both public and protected routes in this group share the same marketing-style layout
2. **Clear Intent**: The nested route groups `(public)` and `(protected)` make authentication requirements explicit
3. **User Experience**: Account pages use the simpler marketing layout instead of the full dashboard interface
4. **SEO Friendly**: Public pages benefit from the marketing layout's SEO optimizations

## Authentication Flow

1. Public pages are accessible to everyone
2. Protected pages (`/account/*`) redirect to `/login` if user is not authenticated
3. After login, users can access both account pages here and dashboard pages

## Adding New Routes

- **Public pages**: Add to `(public)` directory
- **Protected pages using main layout**: Add to `(protected)` directory
- **Dashboard pages**: Use the `(dashboard-layout)` route group instead
