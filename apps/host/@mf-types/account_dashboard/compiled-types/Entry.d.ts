import React from "react";
import type { MiniappEntryProps } from "@org/miniapp-contract";
/**
 * Module Federation exposed entry ("./Entry").
 *
 * Runs inside the host's providers (ThemeProvider + QueryClientProvider). The
 * host injects a scoped, revocable capability grant — never raw credentials.
 * If the grant is missing or revoked, the miniapp degrades to a permission
 * screen instead of showing account data.
 */
export default function Entry({ capabilities }: MiniappEntryProps): React.JSX.Element;
//# sourceMappingURL=Entry.d.ts.map