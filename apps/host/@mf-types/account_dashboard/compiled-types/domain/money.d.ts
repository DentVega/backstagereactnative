import type { CurrencyCode, Direction, Money } from "./types";
/** Thrown when combining Money of different currencies (no FX in the MVP). */
export declare class CurrencyMismatchError extends Error {
    readonly a: CurrencyCode;
    readonly b: CurrencyCode;
    constructor(a: CurrencyCode, b: CurrencyCode);
}
/** Format integer minor units + currency into a localized string. */
export declare function formatMoney(money: Money, locale?: string): string;
/** Debit when negative; credit when zero or positive (by convention). */
export declare function directionOf(money: Money): Direction;
/** Add two Money of the SAME currency. Throws CurrencyMismatchError otherwise. */
export declare function addMoney(a: Money, b: Money): Money;
/**
 * Net sum of transactions' amounts. All must share `currency`; a mismatch
 * rejects with CurrencyMismatchError (no implicit FX).
 */
export declare function netChange(amounts: readonly Money[], currency: CurrencyCode): Money;
//# sourceMappingURL=money.d.ts.map