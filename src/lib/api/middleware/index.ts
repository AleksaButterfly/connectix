import { withAuth, AuthenticatedHandler } from './auth';
import { withErrorHandler } from './error';
import { withSession, SessionHandler } from './session';
import { AuthContext, SessionContext } from './types';

export * from './auth';
export * from './error';
export * from './session';
export * from './types';

export function createAuthenticatedRoute(handler: AuthenticatedHandler) {
  return withErrorHandler(withAuth(handler));
}

export function createAuthenticatedSessionRoute(
  handler: SessionHandler<AuthContext>
) {
  return withErrorHandler(
    withAuth(
      (req, context, auth) => withSession(handler)(req, context, auth)
    )
  );
}