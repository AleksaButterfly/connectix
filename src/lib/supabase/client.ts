import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const createClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  )
}

// Create a client specifically for pages that shouldn't auto-detect session in URL
export const createClientNoAutoDetect = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Don't auto-detect session in URL
        flowType: 'pkce',
      },
    }
  )
}
