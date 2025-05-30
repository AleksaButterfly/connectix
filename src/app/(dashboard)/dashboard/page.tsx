import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to organizations page as the default dashboard view
  redirect('/organizations')
}
