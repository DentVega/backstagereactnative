import React from "react";
import type { Money } from "../domain";
interface Props {
    dateISO: string;
    net: Money;
    locale?: string;
}
declare function SectionHeaderBase({ dateISO, net, locale }: Props): React.JSX.Element;
export declare const SectionHeader: React.MemoExoticComponent<typeof SectionHeaderBase>;
export {};
//# sourceMappingURL=SectionHeader.d.ts.map