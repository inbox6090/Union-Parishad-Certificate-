import { hasAnyTrustedRole, type TrustedIdentity } from './api-access.ts';

// Exhaustive route inventory. Any future API route defaults to deny.
export type ApiAccessLevel = 'public' | 'authenticated' | 'staff' | 'approver' | 'admin' | 'deny';
const staffRoles = ['operator','udc','secretary','approver','chairman','admin','super_admin'];
const approverRoles = ['secretary','approver','chairman','admin','super_admin'];
const adminRoles = ['admin','super_admin'];

const readStaff = new Set([
  '/api/admin/config','/api/admin/logs','/api/admin/stats','/api/admin/trends-30days',
  '/api/admin/pending',
]);
const approveActions = new Set([
  '/api/admin/approve-cert','/api/admin/cancel-cert','/api/admin/batch-approve',
]);
const adminGet = new Set([
  '/api/admin/export','/api/admin/backups','/api/admin/backup/export-secure-file',
  '/api/admin/project-clone/export','/api/admin/maintenance/status',
  '/api/admin/api-keys','/api/admin/webhooks',
]);
const adminPost = new Set([
  '/api/admin/config','/api/admin/apps-script-sync','/api/admin/sheets-export',
  '/api/admin/backup','/api/admin/backup/cloud-secure-export',
  '/api/admin/backup/restore-secure','/api/admin/backup-r2','/api/admin/project-clone/import',
  '/api/admin/restore','/api/admin/maintenance/snapshot','/api/admin/maintenance/clear-cache',
  '/api/admin/api-keys','/api/admin/webhooks','/api/admin/webhooks/test',
]);
const adminDelete = [
  /^\/api\/admin\/api-keys\/[^/]+$/,
  /^\/api\/admin\/webhooks\/[^/]+$/,
];

export function classifyApiRoute(method: string, path: string): ApiAccessLevel {
  const p = path.split('?')[0];
  const m = method.toUpperCase();
  if (!p.startsWith('/api/')) return 'deny';
  if (m === 'GET') {
    if (['/api/health','/api/certificate/types','/api/public/config'].includes(p) ||
      /^\/api\/certificate\/verify\/[^/]+$/.test(p) ||
      /^\/api\/v1\/certificates\/verify\/[^/]+$/.test(p)) return 'public';
    if (p === '/api/users') return 'staff';
    if (p === '/api/applications') return 'staff';
    if (/^\/api\/applications\/[^/]+$/.test(p)) return 'authenticated';
    if (p === '/api/citizen/search' || p === '/api/v1/certificates') return 'staff';
    if (readStaff.has(p)) return 'staff';
    if (adminGet.has(p)) return 'admin';
  }
  if (m === 'POST') {
    if (p === '/api/applications/submit') return 'public'; // legacy citizen workflow
    if (p === '/api/users/sync') return 'authenticated';
    if (/^\/api\/applications\/[^/]+\/status$/.test(p)) return 'staff';
    if (/^\/api\/applications\/[^/]+\/issue$/.test(p)) return 'approver';
    if (p === '/api/certificate/generate' || p === '/api/v1/certificates/apply')
      return 'approver';
    if (['/api/certificate/scan-nid','/api/certificate/verify-batch','/api/ai/assistant'].includes(p))
      return 'staff';
    if (approveActions.has(p)) return 'approver';
    if (adminPost.has(p)) return 'admin';
  }
  if (m === 'DELETE' && adminDelete.some(rx => rx.test(p))) return 'admin';
  return 'deny';
}

export function isAllowedAtLevel(
  level: ApiAccessLevel,
  verifiedIdentity: TrustedIdentity | null | undefined,
): boolean {
  if (level === 'public') return true;
  if (level === 'deny' || !verifiedIdentity?.uid) return false;
  if (level === 'authenticated') return true;
  if (level === 'staff') return hasAnyTrustedRole(verifiedIdentity,staffRoles);
  if (level === 'approver') return hasAnyTrustedRole(verifiedIdentity,approverRoles);
  if (level === 'admin') return hasAnyTrustedRole(verifiedIdentity,adminRoles);
  return false;
}
