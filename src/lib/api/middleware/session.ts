import { NextRequest, NextResponse } from 'next/server';

export interface SessionContext {
  sessionToken: string;
}

export type SessionHandler<T = Record<string, unknown>> = (
  req: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
  extra: T & SessionContext
) => Promise<NextResponse>;

export function withSession<T = Record<string, unknown>>(handler: SessionHandler<T>) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string | string[]>> }, extra?: T) => {
    const sessionToken = req.headers.get('x-session-token');

    if (!sessionToken) {
      return NextResponse.json(
        { 
          error: 'SESSION_REQUIRED',
          message: 'Session token is required'
        },
        { status: 401 }
      );
    }

    return handler(req, context, { ...extra, sessionToken } as T & SessionContext);
  };
}