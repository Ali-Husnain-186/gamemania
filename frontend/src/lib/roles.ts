export const STAFF_ROLES = ['STAFF', 'ADMIN', 'SUPER_ADMIN'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function normalizeRole(role: string | null | undefined): string {
  return (role ?? '').trim().toUpperCase();
}

/** Accept API role as string or `{ name: string }`. */
export function resolveUserRole(role: string | { name?: string } | null | undefined): string {
  if (!role) return '';
  if (typeof role === 'string') return normalizeRole(role);
  return normalizeRole(role.name);
}

export function isStaffRole(role: string | { name?: string } | null | undefined): boolean {
  const normalized = resolveUserRole(role);
  return (STAFF_ROLES as readonly string[]).includes(normalized);
}

export function defaultPostLoginPath(role: string | { name?: string } | null | undefined): string {
  return isStaffRole(role) ? '/admin' : '/account';
}
