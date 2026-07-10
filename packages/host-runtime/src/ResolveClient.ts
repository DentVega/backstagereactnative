import type { ResolveRequest, ResolveResponse } from "@org/miniapp-contract";

/** Asks Backstage which version/url to mount. */
export interface ResolveClient {
  resolve(request: ResolveRequest): Promise<ResolveResponse>;
}

/** HTTP client hitting Backstage `GET /api/resolve`. */
export function httpResolveClient(baseUrl: string): ResolveClient {
  return {
    async resolve(request: ResolveRequest): Promise<ResolveResponse> {
      const url = new URL("/api/resolve", baseUrl);
      url.searchParams.set("id", request.id);
      if (request.hostVersion !== undefined) {
        url.searchParams.set("hostVersion", request.hostVersion);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`resolve failed: HTTP ${res.status}`);
      }
      return (await res.json()) as ResolveResponse;
    },
  };
}
