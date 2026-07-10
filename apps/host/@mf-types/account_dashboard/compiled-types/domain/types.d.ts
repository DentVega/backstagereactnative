/** Domain types for the Account Dashboard. Framework-free, unit-tested. */
/** ISO-4217 currency codes supported in the MVP. */
export type CurrencyCode = "EUR" | "USD" | "MXN";
/** Amount in integer minor units (cents). NEVER a float. Sign carries direction. */
export interface Money {
    readonly amountMinor: number;
    readonly currency: CurrencyCode;
}
export type AccountType = "checking" | "savings" | "credit";
export type Direction = "debit" | "credit";
export interface Account {
    readonly id: string;
    readonly alias: string;
    readonly type: AccountType;
    readonly balance: Money;
    /** Already-masked display number, e.g. "•••• 4321". */
    readonly maskedNumber: string;
}
export interface Transaction {
    readonly id: string;
    readonly accountId: string;
    /** Signed: negative = debit, positive = credit. */
    readonly amount: Money;
    readonly description: string;
    /** ISO-8601 timestamp. */
    readonly date: string;
    readonly direction: Direction;
    readonly category?: string;
}
export interface DayGroup {
    /** Local calendar day key, YYYY-MM-DD. */
    readonly dateISO: string;
    readonly items: readonly Transaction[];
    readonly net: Money;
}
/** Flattened heterogeneous list item (FlashList: getItemType by `type`). */
export type ListItem = {
    readonly type: "header";
    readonly dateISO: string;
    readonly net: Money;
} | {
    readonly type: "row";
    readonly tx: Transaction;
};
//# sourceMappingURL=types.d.ts.map