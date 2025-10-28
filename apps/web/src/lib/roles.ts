/**
 * Role utilities for client-side gating.
 * One export per file.
 */

export type Role = string

/**
 * Check if the user has at least one of the required roles.
 */
export function hasRole(
  userRoles: readonly Role[] | undefined,
  required: readonly Role[],
): boolean {
  if (!userRoles || required.length === 0) return false
  const set: ReadonlySet<Role> = new Set(userRoles)
  return required.some((r: Role) => set.has(r))
}
