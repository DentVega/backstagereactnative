import React from 'react';
import type {MiniappEntryProps} from '@dentvega/miniapp-contract';
import {AppText, Box} from '@dentvega/ui-kit';

/**
 * Default `@dev-miniapp` target when DEV_MINIAPP_PATH is unset (incl. release
 * builds). Renders instructions instead of a real miniapp. Never imports
 * external code, so it is safe in prod.
 */
export default function NoMiniapp(_: MiniappEntryProps): React.JSX.Element {
  return (
    <Box padding="xl" gap="sm">
      <AppText variant="title" accessibilityRole="header">
        Dev Mount
      </AppText>
      <AppText variant="body" color="textMuted">
        Seteá DEV_MINIAPP_PATH=../miniapp-&lt;id&gt; y reiniciá el dev server
        (pnpm start) para montar el Entry de tu miniapp con Fast Refresh.
      </AppText>
    </Box>
  );
}
