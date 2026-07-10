import type { ResolveResponse } from "@org/miniapp-contract";

/**
 * Chunk integrity verification (ADR-008).
 * MVP ships a no-op; the real sha256/signature check is deferred to Operations
 * (needs a crypto module + artifacts published with a hash). Swap the impl,
 * not the call site.
 */
export interface IntegrityVerifier {
  verify(resolved: ResolveResponse): Promise<boolean>;
}

export const noopVerifier: IntegrityVerifier = {
  // Always passes. ⚠️ No cryptographic guarantee — replace before production.
  async verify(): Promise<boolean> {
    return true;
  },
};
