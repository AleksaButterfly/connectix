import { NextRequest, NextResponse } from 'next/server';

export interface SessionContext {
  sessionToken: string;
}

export type SessionHandler<T = any> = (
  req: NextRequest,
  context: any,
  extra: T & SessionContext
) => Promise<NextResponse>;

export function withSession<T = {}>(handler: SessionHandler<T>) {
  return async (req: NextRequest, context: any, extra?: T) => {
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