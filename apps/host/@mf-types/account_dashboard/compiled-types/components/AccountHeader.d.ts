import React from "react";
import type { Account } from "../domain";
interface Props {
    account: Account;
    locale?: string;
}
declare function AccountHeaderBase({ account, locale }: Props): React.JSX.Element;
export declare const AccountHeader: React.MemoExoticComponent<typeof AccountHeaderBase>;
export {};
//# sourceMappingURL=AccountHeader.d.ts.map