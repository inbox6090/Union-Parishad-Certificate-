import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { hasAnyTrustedRole } from './api-access.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}
type TokenVerifier = (token: string) => Promise<DecodedIdToken>;

// Dependency injection permits true 401/403 regression tests without Firebase credentials.
export function createRequireAuth(verifyToken: TokenVerifier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const match = typeof header === 'string' ? /^Bearer ([A-Za-z0-9._-]+)$/.exec(header) : null;
    if (!match) {
      res.status(401).json({ error: 'Unauthorized: Missing or malformed Bearer token' });
      return;
    }
    try {
      // All subsequent role/ownership checks must read this *verified* token only.
      req.user = await verifyToken(match[1]);
      if (!req.user || typeof req.user.uid !== 'string' || !req.user.uid) {
        res.status(401).json({ error: 'Unauthorized: Invalid identity' });
        return;
      }
      next();
    } catch {
      // Never log the JWT or leak the verification reason.
      res.status(401).json({ error: 'Unauthorized: Invalid or revoked token' });
    }
  };
}

export const requireAuth = createRequireAuth(token => adminAuth.verifyIdToken(token, true));

// Existing citizen submission remains publicly accessible for compatibility.
// If a token is supplied it MUST be valid; only verified UID binds ownership.
export async function optionalFirebaseAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    next();
    return;
  }
  return requireAuth(req, res, next);
}


export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Login required' });
      return;
    }
    if (!hasAnyTrustedRole(req.user, allowedRoles)) {
      res.status(403).json({ error: 'Forbidden: Insufficient role' });
      return;
    }
    next();
  };
}
