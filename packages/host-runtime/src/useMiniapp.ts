import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MiniappId, SemVer } from "@dentvega/miniapp-contract";
import {
  initialLoaderState,
  isRetryable,
  nextLoaderState,
  type FallbackReason,
  type LoaderState,
} from "./loaderState";
import { evaluateManifest, type HostProvided } from "./evaluate";
import type { ResolveClient } from "./ResolveClient";
import type { MetricsClient } from "./MetricsClient";
import type { ChunkLoader, EntryComponent } from "./ChunkLoader";
import { noopVerifier, type IntegrityVerifier } from "./integrity";

export interface UseMiniappDeps {
  id: MiniappId;
  resolveClient: ResolveClient;
  chunkLoader: ChunkLoader;
  hostProvided: HostProvided;
  integrity?: IntegrityVerifier;
  /** contractVersion del propio host — habilita el guard host-too-old (minHostContract). */
  hostContractVersion?: string;
  /** Versión servida a resolver (del catálogo) — habilita el cache por-versión. */
  resolveVersion?: string;
  /** Telemetría (best-effort): reporta mount / fallback. Opcional → no-op si falta. */
  metrics?: MetricsClient;
  /** Auto-retry en fallas transitorias. Defaults: maxAuto=1, backoffMs=800. */
  retry?: { maxAuto?: number; backoffMs?: number };
}

export interface UseMiniappResult {
  state: LoaderState;
  Entry: EntryComponent | null;
  /** Re-corre el pipeline (retry manual, budget de auto-retry fresco). */
  reload: () => void;
  /** True mientras un auto-retry está en vuelo (para mostrar "Reintentando…"). */
  retrying: boolean;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Drives resolve → evaluate → verify → load → mount, mapping every failure to a
 * fallback state (never throws into the React tree). Auto-retries transient
 * failures (isRetryable) up to `maxAuto` times with a backoff before giving up.
 */
export function useMiniapp(deps: UseMiniappDeps): UseMiniappResult {
  const { id, resolveClient, chunkLoader, hostProvided } = deps;
  const integrity = deps.integrity ?? noopVerifier;
  const maxAuto = deps.retry?.maxAuto ?? 1;
  const backoffMs = deps.retry?.backoffMs ?? 800;

  const [state, dispatch] = useReducer(nextLoaderState, initialLoaderState);
  const [Entry, setEntry] = useState<EntryComponent | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const cancelled = useRef(false);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    cancelled.current = false;
    setRetrying(false);

    (async () => {
      for (let tryNo = 0; ; tryNo++) {
        if (tryNo > 0) setRetrying(true);
        dispatch({ type: "start" });

        let failure: { reason: FallbackReason; detail: string } | null = null;
        let component: EntryComponent | null = null;
        let mountVersion: string | undefined;
        try {
          const resolved = await resolveClient.resolve({ id, version: deps.resolveVersion as SemVer | undefined });
          if (cancelled.current) return;
          mountVersion = resolved.version;

          const evaluated = evaluateManifest(resolved.manifest, hostProvided, deps.hostContractVersion);
          if (!evaluated.ok) {
            failure = { reason: evaluated.reason, detail: evaluated.detail };
          } else {
            const intact = await integrity.verify(resolved);
            if (cancelled.current) return;
            if (!intact) {
              failure = { reason: "integrity-failed", detail: "integrity check failed" };
            } else {
              dispatch({ type: "resolved", resolved });
              component = await chunkLoader.load(resolved);
              if (cancelled.current) return;
            }
          }
        } catch (err) {
          const detail = err instanceof Error ? err.message : "unknown error";
          // Surface the failure so miniapp load errors are diagnosable in the field.
          console.warn("[miniapp] load failed:", detail);
          failure = {
            reason: detail.startsWith("resolve failed") ? "resolve-failed" : "download-failed",
            detail,
          };
        }
        if (cancelled.current) return;

        if (failure === null && component !== null) {
          const mounted = component;
          setEntry(() => mounted);
          dispatch({ type: "mounted" });
          deps.metrics?.track({ type: "mount", id, version: mountVersion });
          setRetrying(false);
          return;
        }

        const f = failure ?? { reason: "download-failed" as FallbackReason, detail: "no component" };
        if (isRetryable(f.reason) && tryNo < maxAuto) {
          await sleep(backoffMs);
          if (cancelled.current) return;
          continue;
        }
        dispatch({ type: "fail", reason: f.reason, detail: f.detail });
        deps.metrics?.track({ type: "fallback", id, reason: f.reason });
        setRetrying(false);
        return;
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [id, resolveClient, chunkLoader, hostProvided, integrity, deps.hostContractVersion, deps.resolveVersion, attempt, maxAuto, backoffMs]);

  return { state, Entry, reload, retrying };
}
