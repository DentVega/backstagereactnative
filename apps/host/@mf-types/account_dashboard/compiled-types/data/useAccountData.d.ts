import { type UseQueryResult } from "@tanstack/react-query";
import type { Account, Transaction } from "../domain";
export interface AccountData {
    readonly account: Account;
    readonly transactions: readonly Transaction[];
}
/**
 * React Query hook. The QueryClient is a shared singleton provided by the host,
 * so the cache is unified across host and miniapps (no duplicate fetch).
 */
export declare function useAccountData(): UseQueryResult<AccountData>;
//# sourceMappingURL=useAccountData.d.ts.map