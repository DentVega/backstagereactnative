import { create } from 'zustand';
import type {Capability} from '@dentvega/miniapp-contract';

export interface SessionState {
  userId: string | null;
  isAuthenticated: boolean;
  // The token NEVER leaves the host; miniapps receive scoped capabilities only.
  token: string | null;
  login: () => void;
  logout: () => void;
}

export const useSession = create<SessionState>((set) => ({
  userId: null,
  isAuthenticated: false,
  token: null,
  login: () =>
    set({ userId: 'user-001', isAuthenticated: true, token: 'mock-token' }),
  logout: () => set({ userId: null, isAuthenticated: false, token: null }),
}));

/** Pure: which scoped capabilities an authenticated session grants a miniapp. */
export function deriveCapabilities(isAuthenticated: boolean): Capability[] {
  return isAuthenticated ? ['accounts:read', 'session:whoami'] : [];
}
