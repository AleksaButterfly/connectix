import { createClient } from '@/lib/supabase/client'
import { storableError } from '@/lib/errors'

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

      // Log successful signup asynchronously (fire and forget)
      if (data.user) {
        this.logAction('user.signup', 'user', data.user.id, data.user.id).catch((err) =>
          console.error('Background audit log failed:', err)
        )
      }

      return { data, error: null }
    } catch (error) {
      return storableError(error)
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Log successful login asynchronously (fire and forget)
      if (data.user) {
        this.logAction('user.login', 'user', data.user.id, data.user.id).catch((err) =>
          console.error('Background audit log failed:', err)
        )
      }

      return { data, error: null }
    } catch (error) {
      return storableError(error)
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
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

      if (error) throw error

      // Log successful password update asynchronously (fire and forget)
      if (user) {
        this.logAction('user.password_updated', 'user', user.id, user.id).catch((err) =>
          console.error('Background audit log failed:', err)
        )
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

      // Note: We can't log the user_id here because OAuth redirect happens before we have the user
      // You would need to log this in the callback after the user is authenticated

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

      // Log OAuth login after successful exchange
      if (!error && data.user) {
        const provider = new URLSearchParams(url).get('provider')
        if (provider) {
          await this.logAction(`user.login`, 'user', data.user.id, data.user.id, {
            provider: provider,
          })
        }
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Public method for logging actions from other parts of the app
  async logUserAction(
    action: string,
    resourceType: string,
    resourceId: string | null,
    additionalMetadata?: Record<string, any>
  ) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.warn('Cannot log action - no authenticated user')
        return
      }

      await this.logAction(action, resourceType, resourceId, user.id, additionalMetadata)
    } catch (error) {
      console.error('Failed to log user action:', error)
    }
  }

  // Security: Log all auth actions
  private async logAction(
    action: string,
    resourceType: string,
    resourceId: string | null,
    userId: string,
    additionalMetadata?: Record<string, any>
  ) {
    try {
      // Skip if we don't have a user ID
      if (!userId) {
        console.warn('Cannot log action without user ID')
        return
      }

      // Get IP address if possible (in production, this would come from request headers)
      let ipAddress = 'unknown'
      try {
        // Note: In production, IP should come from server-side headers, not client-side API
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        ipAddress = data.ip
      } catch {
        // Fallback if IP service fails
      }

      const insertData = {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
      }

      console.log('Attempting to insert audit log:', insertData)

      const { data, error } = await this.supabase.from('audit_logs').insert(insertData).select()

      if (error) {
        console.error('Failed to create audit log:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          insertData,
        })
      } else {
        console.log('Audit log created successfully:', data)
      }
    } catch (error) {
      console.error('Audit log error:', error)
      // Don't throw - logging failures shouldn't break auth flow
    }
  }

  // Method to log OAuth completion (call this from your auth callback page)
  async logOAuthCompletion(provider: 'github' | 'google', userId: string) {
    await this.logAction(`user.oauth_${provider}_completed`, 'user', userId, userId, {
      provider,
    })
  }
}

export const authService = new AuthService()
