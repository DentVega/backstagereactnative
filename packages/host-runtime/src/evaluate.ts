import {
  isManifest,
  satisfiesShared,
  type Manifest,
  type SemVer,
} from "@org/miniapp-contract";
import type { FallbackReason } from "./loaderState";

/** Versions the host provides as singletons (name → concrete version). */
export type HostProvided = Readonly<Record<string, SemVer>>;

export type EvaluateResult =
  | { ok: true; manifest: Manifest }
  | { ok: false; reason: FallbackReason; detail: string };

/**
 * Validate an untrusted manifest before mounting: structural shape, then
 * singleton version-skew against what the host provides. Pure — reused in tests.
 */
export function evaluateManifest(
  manifest: unknown,
  hostProvided: HostProvided,
): EvaluateResult {
  if (!isManifest(manifest)) {
    return { ok: false, reason: "invalid-manifest", detail: "bad manifest shape" };
  }
  const skew = satisfiesShared(hostProvided, manifest.shared);
  if (!skew.compatible) {
    const bad = skew.entries
      .filter((e) => e.status !== "ok")
      .map((e) => `${e.name}(${e.status})`)
      .join(", ");
    return { ok: false, reason: "skew", detail: `incompatible: ${bad}` };
  }
  return { ok: true, manifest };
}
