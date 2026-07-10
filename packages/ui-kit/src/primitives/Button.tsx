import React from "react";
import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./AppText";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: "primary" | "danger";
}

export function Button({
  label,
  variant = "primary",
  style,
  disabled,
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const backgroundColor = variant === "danger" ? theme.colors.danger : theme.colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        { backgroundColor, borderRadius: theme.radii.md, opacity: state.pressed ? 0.85 : 1 },
        disabled === true ? styles.disabled : null,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      <AppText variant="title" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44, // accessibility: min touch target
    minWidth: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  label: { color: "#FFFFFF" },
});
