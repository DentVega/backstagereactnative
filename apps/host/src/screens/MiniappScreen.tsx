import React, {useMemo} from 'react';
import {SafeAreaView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '@dentvega/ui-kit';
import {
  MiniappHost,
  createScopedGrant,
  httpResolveClient,
  sha256Verifier,
} from '@dentvega/host-runtime';
import type {RootStackParamList} from '../navigation';
import {useSession, deriveCapabilities} from '../session/store';
import {repackChunkLoader} from '../chunkLoader';
import {HOST_PROVIDED, BACKSTAGE_BASE_URL} from '../hostProvided';

type Props = NativeStackScreenProps<RootStackParamList, 'Miniapp'>;

const resolveClient = httpResolveClient(BACKSTAGE_BASE_URL);
// Verify the downloaded chunk's sha256 against the manifest before mounting.
const integrityVerifier = sha256Verifier();

export function MiniappScreen({route}: Props): React.JSX.Element {
  const theme = useTheme();
  const {id} = route.params;
  const isAuthenticated = useSession((s) => s.isAuthenticated);

  // Scoped, revocable grant derived from the host session — never the raw token.
  const grant = useMemo(
    () => createScopedGrant(deriveCapabilities(isAuthenticated)).grant,
    [isAuthenticated],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <MiniappHost
        id={id}
        resolveClient={resolveClient}
        chunkLoader={repackChunkLoader}
        hostProvided={HOST_PROVIDED}
        capabilities={grant}
        integrity={integrityVerifier}
      />
    </SafeAreaView>
  );
}
