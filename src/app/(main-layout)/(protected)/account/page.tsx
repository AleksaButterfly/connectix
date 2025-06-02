import { redirect } from 'next/navigation'

export default function AccountPage() {
  // Redirect to organizations page as the default dashboard view
  redirect('/account/settings')
}
