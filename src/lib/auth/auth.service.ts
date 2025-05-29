import { createClient } from '@/lib/supabase/client'

export class AuthService {
  private supabase = createClient()

  async signUp(email: string, password: string, username: string) {
    try {
      // Sign up the user
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // The profile will be created by the database trigger
      // No need to manually create it here

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Log successful login
      await this.logAction('user.login', 'auth', data.user?.id || '')

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  async signInWithProvider(provider: 'github' | 'google') {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }

  // Security: Log all auth actions
  private async logAction(action: string, resourceType: string, resourceId: string) {
    try {
      await this.supabase.from('audit_logs').insert({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: '', // Would get from request headers in production
        user_agent: navigator.userAgent,
      })
    } catch (error) {
      console.error('Audit log error:', error)
    }
  }
}

export const authService = new AuthService()
