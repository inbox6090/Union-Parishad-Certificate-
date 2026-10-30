// Pure authorization rules: trust only Firebase Admin SDK-verified ID token claims.
// Never authorize based on client localStorage, supplied email, or request JSON.
export type TrustedIdentity = {
  uid: string;
  role?: unknown;
  roles?: unknown;
};
const staffRoles = ['operator','udc','secretary','approver','chairman','admin','super_admin'] as const;
const approverRoles = ['secretary','approver','chairman','admin','super_admin'] as const;
export function hasTrustedRole(user: TrustedIdentity | null | undefined, role: string): boolean {
  if (!user || typeof user.uid !== 'string' || !user.uid) return false;
  if (user.role === role) return true;
  return !!user.roles && typeof user.roles === 'object' &&
    (user.roles as Record<string, unknown>)[role] === true;
}
export function hasAnyTrustedRole(user: TrustedIdentity | null | undefined, roles: readonly string[]) {
  return roles.some(role => hasTrustedRole(user,role));
}
export function isStaff(user: TrustedIdentity | null | undefined) {
  return hasAnyTrustedRole(user,staffRoles);
}
export function isApprover(user: TrustedIdentity | null | undefined) {
  return hasAnyTrustedRole(user,approverRoles);
}
export function canReadApplication(
  user: TrustedIdentity | null | undefined,
  application: { applicantUid?: string | null }
) {
  return !!user && (isStaff(user) || (
    typeof application.applicantUid === 'string' &&
    application.applicantUid.length > 0 &&
    application.applicantUid === user.uid
  ));
}
export function canChangeStatus(
  user: TrustedIdentity | null | undefined,
  current: string,
  next: string
) {
  if (isApprover(user)) {
    return ['submitted','under_review','needs_information','approved'].includes(current) &&
      ['under_review','needs_information','approved','rejected'].includes(next);
  }
  return isStaff(user) &&
    ['submitted','under_review','needs_information'].includes(current) &&
    ['under_review','needs_information','submitted'].includes(next);
}
export function canIssueCertificate(
  user: TrustedIdentity | null | undefined,
  application: { status: string }
) {
  return isApprover(user) && application.status === 'approved';
}
export function toPublicVerification(cert: {
  memoNo:string; typeLabel:string; issueDate:string; issuedBy:string; status:string
}) {
  // Deliberately allowlist fields; never spread the private certificate.
  return {
    memoNo: cert.memoNo,
    typeLabel: cert.typeLabel,
    issueDate: cert.issueDate,
    issuedBy: cert.issuedBy,
    status: cert.status,
    isValid: cert.status === 'issued' || cert.status === 'approved',
  };
}
