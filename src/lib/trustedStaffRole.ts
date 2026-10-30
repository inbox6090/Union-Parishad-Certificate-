import type { AdminUserRecord } from '../types';

// ONLY call with Firebase Auth getIdTokenResult().claims, not with client form data.
export type VerifiedClaimMap = Record<string,unknown>;
export type LegacyStaffRole = AdminUserRecord['role'];
const roleAliases: Record<string,LegacyStaffRole> = {
  operator:'member', udc:'member', member:'member',
  secretary:'secretary', approver:'secretary',
  chairman:'chairman', admin:'super_admin', super_admin:'super_admin',
};
// An unknown/developer/citizen role never grants staff access.
export function trustedStaffRoleFromClaims(claims: VerifiedClaimMap): LegacyStaffRole | null {
  if (typeof claims.role === 'string') {
    const role=roleAliases[claims.role];
    if (role) return role;
  }
  if (claims.roles && typeof claims.roles === 'object' && !Array.isArray(claims.roles)) {
    const roles=claims.roles as VerifiedClaimMap;
    for(const name of ['super_admin','admin','chairman','approver','secretary','udc','operator','member']) {
      if (roles[name] === true) return roleAliases[name];
    }
  }
  return null;
}
export function trustedAdminRecord(
  user: {uid:string;email:string|null;displayName:string|null;photoURL:string|null},
  claims: VerifiedClaimMap
): AdminUserRecord | null {
  if (!user.uid) return null;
  const role=trustedStaffRoleFromClaims(claims);
  if (!role) return null;
  return {
    uid:user.uid,
    email:user.email || '',
    name:user.displayName || 'অনুমোদিত কর্মকর্তা',
    role, designation: role==='super_admin'?'প্রশাসক':role==='chairman'?'অনুমোদনকারী':role==='secretary'?'সচিব / অনুমোদনকারী':'ডিজিটাল সেন্টার অপারেটর',
    photoUrl:user.photoURL || undefined,
    addedAt:new Date().toISOString(),
    status:'active',
  };
}
