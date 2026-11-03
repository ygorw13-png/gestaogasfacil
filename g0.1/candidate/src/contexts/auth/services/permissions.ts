export type ExistingRole = 'admin' | 'user' | 'entregador';
export type PermissionState = { ready: boolean; error: boolean; roles: ExistingRole[] };
export function canUseRole(state: PermissionState, requested: string | string[]) {
  if (!state.ready || state.error || state.roles.length!==1) return false;
  const wanted=Array.isArray(requested) ? requested : [requested];
  return wanted.some(role=>state.roles.includes(role as ExistingRole));
}
export function verifiedRole(state: PermissionState): ExistingRole | null {
  return state.ready && !state.error && state.roles.length===1 ? state.roles[0] : null;
}
export const hasUserRole=canUseRole;
export const getUserRole=verifiedRole;