'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

interface AuthRouteProps {
  children: React.ReactNode
}

export default function AuthRoute({ children }: AuthRouteProps) {
  return children
}
