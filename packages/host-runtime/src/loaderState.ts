import type { ResolveResponse } from "@org/miniapp-contract";

export type FallbackReason =
  | "resolve-failed"
  | "download-failed"
  | "invalid-manifest"
  | "skew"
  | "integrity-failed";

export type LoaderState =
  | { status: "idle" }
  | { status: "resolving" }
  | { status: "downloading"; resolved: ResolveResponse }
  | { status: "mounted"; resolved: ResolveResponse }
  | { status: "fallback"; reason: FallbackReason; detail?: string };

export type LoaderEvent =
  | { type: "start" }
  | { type: "resolved"; resolved: ResolveResponse }
  | { type: "mounted" }
  | { type: "fail"; reason: FallbackReason; detail?: string };

export const initialLoaderState: LoaderState = { status: "idle" };

/** Pure reducer for the loader lifecycle. A failure never throws — it maps to fallback. */
export function nextLoaderState(state: LoaderState, event: LoaderEvent): LoaderState {
  switch (event.type) {
    case "start":
      return { status: "resolving" };
    case "resolved":
      return { status: "downloading", resolved: event.resolved };
    case "mounted":
      return state.status === "downloading"
        ? { status: "mounted", resolved: state.resolved }
        : state;
    case "fail":
      return { status: "fallback", reason: event.reason, detail: event.detail };
    default:
      return state;
  }
}
