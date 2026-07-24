export const STAFF_ROLES = ['STAFF', 'ADMIN', 'SUPER_ADMIN'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function normalizeRole(role: string | null | undefined): string {
  return (role ?? '').trim().toUpperCase();
}

export function isStaffRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return (STAFF_ROLES as readonly string[]).includes(normalized);
}

export function defaultPostLoginPath(role: string | null | undefined): string {
  return isStaffRole(role) ? '/admin' : '/account';
}
