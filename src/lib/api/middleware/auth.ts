import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface AuthContext {
  user: User;
  supabase: SupabaseClient<Database>;
}

export type AuthenticatedHandler = (
  req: NextRequest,
  context: any,
  auth: AuthContext
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: any) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { 
            error: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          { status: 401 }
        );
      }

      return handler(req, context, { user, supabase });
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { 
          error: 'AUTH_ERROR',
          message: 'Authentication failed'
        },
        { status: 500 }
      );
    }
  };
}