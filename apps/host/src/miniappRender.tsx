import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {AppText, Box, Button, useTheme} from '@dentvega/ui-kit';
import type {
  FallbackReason,
  MiniappErrorProps,
  MiniappHostRender,
  MiniappLoadingProps,
} from '@dentvega/miniapp-runtime';

// Copy del host (es-AR). El runtime publicado es headless y trae su propio copy en inglés.
const FALLBACK_COPY: Record<FallbackReason, string> = {
  'resolve-failed': 'No pudimos localizar esta miniapp.',
  'download-failed': 'No pudimos descargar esta miniapp.',
  'invalid-manifest': 'La miniapp tiene un manifiesto inválido.',
  skew: 'Esta miniapp no es compatible con esta versión de la app. Actualizá la app para usarla.',
  'integrity-failed': 'No pudimos verificar la integridad de la miniapp.',
  'host-too-old': 'Actualizá la app para usar esta miniapp.',
  'invalid-signature': 'No pudimos verificar la firma de esta miniapp.',
  'unknown-key': 'Esta miniapp no está autorizada para ejecutarse.',
};

function MiniappLoading({retrying}: MiniappLoadingProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      testID="miniapp-loading"
      style={[styles.center, {backgroundColor: theme.colors.background}]}>
      <ActivityIndicator color={theme.colors.primary} />
      {retrying ? (
        <AppText variant="body" color="textMuted">
          Reintentando…
        </AppText>
      ) : null}
    </View>
  );
}

function MiniappFallback({reason, retryable, onRetry}: MiniappErrorProps): React.JSX.Element {
  return (
    <Box padding="xl" gap="sm" style={styles.center}>
      <AppText variant="title" color="danger" accessibilityRole="header">
        Miniapp no disponible
      </AppText>
      <AppText variant="body" color="textMuted">
        {FALLBACK_COPY[reason]}
      </AppText>
      {retryable ? <Button label="Reintentar" onPress={onRetry} /> : null}
    </Box>
  );
}

export const miniappRender: MiniappHostRender = {
  loading: MiniappLoading,
  error: MiniappFallback,
};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8},
});
