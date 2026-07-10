import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText, Box, Button, useTheme } from "@org/ui-kit";
import type { CapabilityGrant, MiniappId } from "@org/miniapp-contract";
import { useMiniapp } from "./useMiniapp";
import type { ResolveClient } from "./ResolveClient";
import type { ChunkLoader } from "./ChunkLoader";
import type { HostProvided } from "./evaluate";
import type { IntegrityVerifier } from "./integrity";
import type { FallbackReason } from "./loaderState";

export interface MiniappHostProps {
  id: MiniappId;
  resolveClient: ResolveClient;
  chunkLoader: ChunkLoader;
  hostProvided: HostProvided;
  capabilities: CapabilityGrant;
  integrity?: IntegrityVerifier;
  onRetry?: () => void;
}

const FALLBACK_COPY: Record<FallbackReason, string> = {
  "resolve-failed": "No pudimos localizar esta miniapp.",
  "download-failed": "No pudimos descargar esta miniapp.",
  "invalid-manifest": "La miniapp tiene un manifiesto inválido.",
  skew: "Esta miniapp no es compatible con esta versión de la app.",
  "integrity-failed": "No pudimos verificar la integridad de la miniapp.",
};

export function MiniappHost(props: MiniappHostProps): React.JSX.Element {
  const theme = useTheme();
  const { state, Entry } = useMiniapp({
    id: props.id,
    resolveClient: props.resolveClient,
    chunkLoader: props.chunkLoader,
    hostProvided: props.hostProvided,
    integrity: props.integrity,
  });

  if (state.status === "fallback") {
    return (
      <Box padding="xl" gap="sm" style={styles.center}>
        <AppText variant="title" color="danger" accessibilityRole="header">
          Miniapp no disponible
        </AppText>
        <AppText variant="body" color="textMuted">
          {FALLBACK_COPY[state.reason]}
        </AppText>
        {props.onRetry !== undefined ? (
          <Button label="Reintentar" onPress={props.onRetry} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
});
