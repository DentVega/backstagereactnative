import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText, Box, Button, useTheme } from "@dentvega/ui-kit";
import type { CapabilityGrant, MiniappId } from "@dentvega/miniapp-contract";
import { useMiniapp } from "./useMiniapp";
import type { ResolveClient } from "./ResolveClient";
import type { ChunkLoader } from "./ChunkLoader";
import type { HostProvided } from "./evaluate";
import type { IntegrityVerifier } from "./integrity";
import { isRetryable, type FallbackReason } from "./loaderState";

export interface MiniappHostProps {
  id: MiniappId;
  resolveClient: ResolveClient;
  chunkLoader: ChunkLoader;
  hostProvided: HostProvided;
  capabilities: CapabilityGrant;
  integrity?: IntegrityVerifier;
  onRetry?: () => void;
  retry?: { maxAuto?: number; backoffMs?: number };
  /** contractVersion del host — habilita el guard host-too-old (minHostContract). */
  hostContractVersion?: string;
}

const FALLBACK_COPY: Record<FallbackReason, string> = {
  "resolve-failed": "No pudimos localizar esta miniapp.",
  "download-failed": "No pudimos descargar esta miniapp.",
  "invalid-manifest": "La miniapp tiene un manifiesto inválido.",
  skew: "Esta miniapp no es compatible con esta versión de la app. Actualizá la app para usarla.",
  "integrity-failed": "No pudimos verificar la integridad de la miniapp.",
  "host-too-old": "Actualizá la app para usar esta miniapp.",
};

export function MiniappHost(props: MiniappHostProps): React.JSX.Element {
  const theme = useTheme();
  const { state, Entry, reload, retrying } = useMiniapp({
    id: props.id,
    resolveClient: props.resolveClient,
    chunkLoader: props.chunkLoader,
    hostProvided: props.hostProvided,
    integrity: props.integrity,
    retry: props.retry,
    hostContractVersion: props.hostContractVersion,
  });

  if (state.status === "fallback") {
    const canRetry = isRetryable(state.reason);
    return (
      <Box padding="xl" gap="sm" style={styles.center}>
        <AppText variant="title" color="danger" accessibilityRole="header">
          Miniapp no disponible
        </AppText>
        <AppText variant="body" color="textMuted">
          {FALLBACK_COPY[state.reason]}
        </AppText>
        {canRetry ? (
          <Button label="Reintentar" onPress={props.onRetry ?? reload} />
        ) : null}
      </Box>
    );
  }

  if (state.status === "mounted" && Entry !== null) {
    const MountedEntry = Entry;
    return <MountedEntry capabilities={props.capabilities} />;
  }

  return (
    <View
      testID="miniapp-loading"
      style={[styles.center, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator color={theme.colors.primary} />
      {retrying ? (
        <AppText variant="body" color="textMuted">
          Reintentando…
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
});
