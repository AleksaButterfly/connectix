# Dashboard Layout Route Group

This route group `(dashboard-layout)` contains all pages that use the application dashboard layout with sidebar navigation and app-specific UI components.

## Layout Structure

The dashboard layout (`layout.tsx`) provides:

- Sidebar navigation with organization/project context
- Top header with user menu and notifications
- App-specific UI components and styling
- Organization/workspace switcher
- No marketing footer

## Route Organization

All routes in this group require authentication.

### Core Dashboard Routes

- `/dashboard` - Main dashboard/home page
- `/dashboard/organizations` - Organizations list
- `/dashboard/organizations/new` - Create new organization
- `/dashboard/organizations/[id]` - Organization overview
- `/dashboard/organizations/[id]/settings` - Organization settings
- `/dashboard/organizations/[id]/team` - Team management

## Why This Structure?

1. **App Experience**: Full application interface for authenticated users
2. **Context Aware**: Sidebar shows current organization/project context
3. **Feature Rich**: Includes app-specific navigation and tools
4. **Workspace Focused**: Designed for productivity and daily use

## Authentication

- **All routes require authentication** - Redirects to `/login` if not authenticated
- Uses middleware to enforce authentication
- May include role-based access control (RBAC) for organization features

## Key Differences from Main Layout

| Feature       | Main Layout           | Dashboard Layout |
| ------------- | --------------------- | ---------------- |
| Navigation    | Simple header         | Sidebar + header |
| Footer        | Marketing footer      | None             |
| Target Users  | Public + account mgmt | Active app users |
| UI Style      | Marketing/clean       | App/feature-rich |
| Auth Required | Mixed                 | Always           |

## Adding New Routes

1. Create new directories under `/dashboard`
2. All routes automatically require authentication
3. Consider organization context (use `[id]` params when needed)
4. Follow existing patterns for consistency

## Common Patterns
