import { createClient } from '@/lib/supabase/client'

export class AuthService {
  private supabase = createClient()

  async signUp(email: string, password: string, username: string) {
    try {
      // First check if username is already taken
      const { data: existingUser, error: checkError } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        throw checkError
      }

      if (existingUser) {
        throw new Error('username_taken')
      }

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
    } catch (error: any) {
      // Map database errors to user-friendly messages
      let message = error.message || 'An unexpected error occurred'

      if (message === 'username_taken') {
        message = 'This username is already taken'
      } else if (
        message.includes('Database error saving new user') ||
        message.includes('duplicate key value') ||
        message.includes('unique constraint') ||
        message.includes('23505')
      ) {
        // This is likely a username conflict from the database trigger
        message = 'This username is already taken'
      } else if (message.includes('User already registered')) {
        message = 'This email is already registered'
      }

      return {
        data: null,
        error: { message },
      }
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
    try {
      // Get current user before signing out for logging
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      const { error } = await this.supabase.auth.signOut()

      if (!error && user) {
        // Log successful logout
        await this.logAction('user.logout', 'auth', user.id)
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  async resetPassword(email: string) {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (!error) {
        // Log password reset request
        await this.logAction('user.password_reset_requested', 'auth', email)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updatePassword(newPassword: string) {
    try {
      // Get current user for logging
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (!error && user) {
        // Log successful password update
        await this.logAction('user.password_updated', 'auth', user.id)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async signInWithProvider(provider: 'github' | 'google') {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'github' ? 'read:user user:email' : 'email profile',
        },
      })

      if (!error) {
        // Log OAuth attempt
        await this.logAction(`user.oauth_${provider}_initiated`, 'auth', '')
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Helper method to verify email
  async resendVerificationEmail(email: string) {
    try {
      const { data, error } = await this.supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get current session
  async getSession() {
    try {
      const { data, error } = await this.supabase.auth.getSession()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get current user
  async getUser() {
    try {
      const { data, error } = await this.supabase.auth.getUser()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Refresh session
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Exchange code for session (used in auth callback)
  async exchangeCodeForSession(url: string) {
    try {
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(url)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Security: Log all auth actions
  private async logAction(action: string, resourceType: string, resourceId: string) {
    try {
      // Get IP address if possible (in production, this would come from request headers)
      let ipAddress = ''
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        ipAddress = data.ip
      } catch {
        // Fallback if IP service fails
        ipAddress = 'unknown'
      }

      await this.supabase.from('audit_logs').insert({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          origin: window.location.origin,
        },
      })
    } catch (error) {
      console.error('Audit log error:', error)
      // Don't throw - logging failures shouldn't break auth flow
    }
  }
}

export const authService = new AuthService()
