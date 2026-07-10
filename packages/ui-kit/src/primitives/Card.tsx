import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export type CardProps = ViewProps;

export function Card({ style, ...rest }: CardProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    // elevation via shadow only (transform/opacity-safe; no layout thrash)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
