import type { CurrencyCode, DayGroup, ListItem, Transaction } from "./types";
/**
 * Group transactions by local day, newest day first, and compute each day's net.
 * All transactions must share `currency` (net rejects a mismatch).
 */
export declare function groupByDay(transactions: readonly Transaction[], currency: CurrencyCode): DayGroup[];
/** Flatten day groups into a heterogeneous list for FlashList (header + rows). */
export declare function toListItems(groups: readonly DayGroup[]): ListItem[];
/** Keep only the last 4 digits; mask the rest. Never expose a full number. */
export declare function maskAccountNumber(full: string): string;
//# sourceMappingURL=transactions.d.ts.map