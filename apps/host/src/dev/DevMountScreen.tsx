import React, {useMemo} from 'react';
import {SafeAreaView} from 'react-native';
import {useTheme} from '@dentvega/ui-kit';
import {createScopedGrant} from '@dentvega/host-runtime';
import type {Capability} from '@dentvega/miniapp-contract';
// Alias → the local miniapp's ./Entry (or NoMiniapp placeholder). Fast Refresh
// applies because the aliased file is part of the host's module graph.
import Entry from '@dev-miniapp';

/**
 * Dev-only: renders a LOCAL miniapp's Entry directly (no federation) with a
 * mock capability grant built from its manifest, so you get real Fast Refresh
 * while building the UI. Gated behind __DEV__ at the nav level.
 */
export function DevMountScreen(): React.JSX.Element {
  const theme = useTheme();
  const grant = useMemo(
    () => createScopedGrant(__DEV_MINIAPP_CAPS__ as Capability[]).grant,
    [],
  );
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Entry capabilities={grant} />
    </SafeAreaView>
  );
}
