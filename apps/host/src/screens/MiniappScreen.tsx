import React, {useMemo} from 'react';
import {SafeAreaView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '@dentvega/ui-kit';
import {
  MiniappHost,
  createScopedGrant,
  httpResolveClient,
  sha256Verifier,
  noopVerifier,
  parseDevRemotes,
  devResolveClient,
  isDevRemote,
} from '@dentvega/host-runtime';
import type {RootStackParamList} from '../navigation';
import {useSession, deriveCapabilities} from '../session/store';
import {repackChunkLoader} from '../chunkLoader';
import {HOST_PROVIDED, BACKSTAGE_BASE_URL} from '../hostProvided';

type Props = NativeStackScreenProps<RootStackParamList, 'Miniapp'>;

// Dev remotes (Mode 2): under __DEV__, listed ids resolve to their live dev
// server (no integrity). In release, __DEV_REMOTES__ is '' → empty map → the
// real HTTP client + sha256 verifier, unchanged.
const devRemotes = __DEV__ ? parseDevRemotes(__DEV_REMOTES__) : {};
const resolveClient = __DEV__
  ? devResolveClient(BACKSTAGE_BASE_URL, devRemotes)
  : httpResolveClient(BACKSTAGE_BASE_URL);
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
        integrity={isDevRemote(id, devRemotes) ? noopVerifier : integrityVerifier}
      />
    </SafeAreaView>
  );
}
