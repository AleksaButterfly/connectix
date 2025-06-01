import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      refreshUser: async () => {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Fetch updated profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          // Update the user in the store
          get().setUser({
            ...user,
            user_metadata: {
              ...user.user_metadata,
              username: profile?.username,
            },
          } as User)
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user
    }
  )
)
