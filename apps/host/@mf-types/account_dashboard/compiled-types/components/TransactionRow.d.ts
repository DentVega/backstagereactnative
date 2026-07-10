import React from "react";
import type { Transaction } from "../domain";
interface Props {
    tx: Transaction;
    locale?: string;
}
declare function TransactionRowBase({ tx, locale }: Props): React.JSX.Element;
/** Memoized: list items must not re-render on unrelated parent updates. */
export declare const TransactionRow: React.MemoExoticComponent<typeof TransactionRowBase>;
export {};
//# sourceMappingURL=TransactionRow.d.ts.map