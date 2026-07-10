import React from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { ColorToken, TypeToken } from "../theme/tokens";

export interface AppTextProps extends TextProps {
  variant?: TypeToken;
  color?: ColorToken;
}

export function AppText({
  variant = "body",
  color = "text",
  style,
  ...rest
}: AppTextProps): React.JSX.Element {
  const theme = useTheme();
  const typeStyle = theme.typography[variant];
  return (
    <Text
      style={[
        styles.base,
        {
          color: theme.colors[color],
          fontSize: typeStyle.fontSize,
          fontWeight: typeStyle.fontWeight,
          lineHeight: typeStyle.lineHeight,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
