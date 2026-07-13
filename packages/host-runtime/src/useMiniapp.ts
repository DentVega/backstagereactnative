import { useEffect, useReducer, useRef, useState } from "react";
import type { MiniappId } from "@org/miniapp-contract";
import {
  initialLoaderState,
  nextLoaderState,
  type LoaderState,
} from "./loaderState";
import { evaluateManifest, type HostProvided } from "./evaluate";
import type { ResolveClient } from "./ResolveClient";
import type { ChunkLoader, EntryComponent } from "./ChunkLoader";
import { noopVerifier, type IntegrityVerifier } from "./integrity";

export interface UseMiniappDeps {
  id: MiniappId;
  resolveClient: ResolveClient;
  chunkLoader: ChunkLoader;
  hostProvided: HostProvided;
  integrity?: IntegrityVerifier;
}

export interface UseMiniappResult {
  state: LoaderState;
  Entry: EntryComponent | null;
}

/**
 * Drives resolve → evaluate → verify → load → mount, mapping every failure to a
 * fallback state (never throws into the React tree).
 */
export function useMiniapp(deps: UseMiniappDeps): UseMiniappResult {
  const { id, resolveClient, chunkLoader, hostProvided } = deps;
  const integrity = deps.integrity ?? noopVerifier;
  const [state, dispatch] = useReducer(nextLoaderState, initialLoaderState);
  const [Entry, setEntry] = useState<EntryComponent | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    dispatch({ type: "start" });

    (async () => {
      try {
        const resolved = await resolveClient.resolve({ id });
        if (cancelled.current) return;

        const evaluated = evaluateManifest(resolved.manifest, hostProvided);
        if (!evaluated.ok) {
          dispatch({ type: "fail", reason: evaluated.reason, detail: evaluated.detail });
          return;
        }

        const intact = await integrity.verify(resolved);
        if (cancelled.current) return;
        if (!intact) {
          dispatch({ type: "fail", reason: "integrity-failed", detail: "integrity check failed" });
          return;
        }

        dispatch({ type: "resolved", resolved });
        const component = await chunkLoader.load(resolved);
        if (cancelled.current) return;

        setEntry(() => component);
        dispatch({ type: "mounted" });
      } catch (err) {
        if (cancelled.current) return;
        const detail = err instanceof Error ? err.message : "unknown error";
        // Surface the failure so miniapp load errors are diagnosable in the field
        // (the fallback UI intentionally hides the detail from users).
        console.warn("[miniapp] load failed:", detail);
        // resolve is the first network step; treat generic failures as download-failed
        // once resolved, else resolve-failed. Kept simple: inspect message prefix.
        const reason = detail.startsWith("resolve failed") ? "resolve-failed" : "download-failed";
        dispatch({ type: "fail", reason, detail });
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [id, resolveClient, chunkLoader, hostProvided, integrity]);

  return { state, Entry };
}
