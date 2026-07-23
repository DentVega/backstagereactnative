export type {
  FallbackReason,
  LoaderState,
  LoaderEvent,
} from "./loaderState";
export { initialLoaderState, nextLoaderState } from "./loaderState";

export type { HostProvided, EvaluateResult } from "./evaluate";
export { evaluateManifest } from "./evaluate";

export type { IntegrityVerifier } from "./integrity";
export { noopVerifier, sha256Verifier } from "./integrity";
export { sha256Hex } from "./sha256";

export type { ResolveClient } from "./ResolveClient";
export { httpResolveClient } from "./ResolveClient";

export { parseDevRemotes, devResolveClient, isDevRemote } from "./devResolveClient";

export type { CatalogClient, MiniappSummary } from "./CatalogClient";
export { httpCatalogClient } from "./CatalogClient";

export type { ChunkLoader, EntryComponent } from "./ChunkLoader";

export type { UseMiniappDeps, UseMiniappResult } from "./useMiniapp";
export { useMiniapp } from "./useMiniapp";

export type { MiniappHostProps } from "./MiniappHost";
export { MiniappHost } from "./MiniappHost";

// --- Capability grant helper (host owns the scoped, revocable grant) ---
import type { Capability, CapabilityGrant } from "@dentvega/miniapp-contract";

export interface ScopedGrant {
  readonly grant: CapabilityGrant;
  readonly revoke: () => void;
}

export function createScopedGrant(granted: readonly Capability[]): ScopedGrant {
  let revoked = false;
  return {
    grant: { granted, isRevoked: () => revoked },
    revoke: () => {
      revoked = true;
    },
  };
}
