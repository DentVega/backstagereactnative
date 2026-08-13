import React, {useMemo, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, View} from 'react-native';
import {AppText, useTheme} from '@dentvega/ui-kit';
import {createScopedGrant} from '@dentvega/host-runtime';
import type {Capability} from '@dentvega/miniapp-contract';
// Fixed slots aliased by rspack.config.mjs to each local miniapp's ./Entry (or the
// NoMiniapp placeholder). Static imports → all are in the host graph → editing ANY
// of them Fast-Refreshes; the picker just switches which one is on screen.
import Entry0 from '@dev-miniapp-0';
import Entry1 from '@dev-miniapp-1';
import Entry2 from '@dev-miniapp-2';
import Entry3 from '@dev-miniapp-3';
import Entry4 from '@dev-miniapp-4';
import Entry5 from '@dev-miniapp-5';

const SLOTS = [Entry0, Entry1, Entry2, Entry3, Entry4, Entry5] as const;

/**
 * Dev-only: renders LOCAL miniapps' Entry directly (no federation), with a mock
 * capability grant from each manifest, so you get real Fast Refresh while building
 * the UI. With several miniapps (DEV_MINIAPP_PATHS), a picker chooses which to
 * show. Gated behind __DEV__ at the nav level.
 */
export function DevMountScreen(): React.JSX.Element {
  const theme = useTheme();
  const metas = __DEV_MINIAPPS__;
  const [active, setActive] = useState(0);
  const idx = active < metas.length ? active : 0;

  const grant = useMemo(
    () =>
      createScopedGrant(
        (__DEV_MINIAPPS__[idx]?.capabilities ?? []) as Capability[],
      ).grant,
    [idx],
  );

  // No miniapp configured → slot 0 is the NoMiniapp placeholder (instructions).
  if (metas.length === 0) {
    const Empty = SLOTS[0];
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
        <Empty capabilities={grant} />
      </SafeAreaView>
    );
  }

  const Active = SLOTS[idx];
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      {metas.length > 1 ? (
        <View style={{borderBottomWidth: 1, borderBottomColor: theme.colors.border}}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{padding: theme.spacing.sm, gap: theme.spacing.sm}}
          >
            {metas.map((m, i) => {
              const on = i === idx;
              return (
                <Pressable
                  key={`${m.name}-${i}`}
                  accessibilityRole="button"
                  accessibilityState={{selected: on}}
                  onPress={() => setActive(i)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: theme.spacing.md,
                    borderRadius: theme.radii.md,
                    borderWidth: 1,
                    borderColor: on ? theme.colors.primary : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <AppText variant="caption" color={on ? 'text' : 'textMuted'}>
                    {m.name}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      <View style={{flex: 1}}>
        <Active capabilities={grant} />
      </View>
    </SafeAreaView>
  );
}
