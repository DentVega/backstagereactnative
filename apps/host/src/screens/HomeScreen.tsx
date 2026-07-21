import React from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useQuery} from '@tanstack/react-query';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppText, Box, Button, Card, useTheme} from '@dentvega/ui-kit';
import {httpCatalogClient, type MiniappSummary} from '@dentvega/host-runtime';
import type {MiniappId} from '@dentvega/miniapp-contract';
import type {RootStackParamList} from '../navigation';
import {useSession} from '../session/store';
import {BACKSTAGE_BASE_URL} from '../hostProvided';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const catalogClient = httpCatalogClient(BACKSTAGE_BASE_URL);

/** One catalog row. Miniapps without a published version can't mount → disabled. */
function MiniappCard({
  item,
  onOpen,
}: {
  item: MiniappSummary;
  onOpen: () => void;
}): React.JSX.Element {
  const published = item.latestVersion !== null;
  return (
    <Card>
      <AppText variant="title">{item.name}</AppText>
      <View style={styles.gap4} />
      <AppText variant="caption" color="textMuted">
        {item.owner}
      </AppText>
      <View style={styles.gap8} />
      <AppText variant="body" color="textMuted">
        {published
          ? `v${item.latestVersion} · ${item.versionCount} ${
              item.versionCount === 1 ? 'versión' : 'versiones'
            }`
          : 'Sin versión publicada'}
      </AppText>
      <View style={styles.gap8} />
      <Button label="Abrir miniapp" onPress={onOpen} disabled={!published} />
    </Card>
  );
}

export function HomeScreen({navigation}: Props): React.JSX.Element {
  const theme = useTheme();
  const {isAuthenticated, login, logout} = useSession();

  const {data, isLoading, isError, refetch, isRefetching} = useQuery({
    queryKey: ['catalog'],
    queryFn: () => catalogClient.list(),
  });

  const header = (
    <Box padding="xl" gap="lg">
      <AppText variant="heading" accessibilityRole="header">
        Backstage Host
      </AppText>

      <Card>
        <AppText variant="caption" color="textMuted">
          Sesión
        </AppText>
        <View style={styles.gap8} />
        <AppText variant="body">
          {isAuthenticated ? 'Autenticado (mock)' : 'Sin sesión'}
        </AppText>
        <View style={styles.gap8} />
        <Button
          label={isAuthenticated ? 'Cerrar sesión' : 'Iniciar sesión'}
          variant={isAuthenticated ? 'danger' : 'primary'}
          onPress={isAuthenticated ? logout : login}
        />
      </Card>

      <AppText variant="title">Miniapps</AppText>
    </Box>
  );

  let empty: React.JSX.Element;
  if (isLoading) {
    empty = (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  } else if (isError) {
    empty = (
      <Box padding="xl" gap="sm" style={styles.center}>
        <AppText variant="body" color="danger">
          No pudimos cargar el catálogo.
        </AppText>
        <Button label="Reintentar" onPress={() => refetch()} />
      </Box>
    );
  } else {
    empty = (
      <Box padding="xl">
        <AppText color="textMuted">No hay miniapps en el catálogo.</AppText>
      </Box>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <FlashList
        data={data ?? []}
        keyExtractor={item => item.id}
        estimatedItemSize={150}
        ListHeaderComponent={header}
        renderItem={({item}) => (
          <View style={styles.item}>
            <MiniappCard
              item={item}
              onOpen={() =>
                navigation.navigate('Miniapp', {
                  id: item.id as MiniappId,
                  title: item.name,
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={empty}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  item: {paddingHorizontal: 24, paddingBottom: 12},
  center: {alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8},
  gap4: {height: 4},
  gap8: {height: 8},
});
