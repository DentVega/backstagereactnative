import React from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { ColorToken, RadiusToken, SpacingToken } from "../theme/tokens";

export interface BoxProps extends ViewProps {
  padding?: SpacingToken;
  gap?: SpacingToken;
  background?: ColorToken;
  radius?: RadiusToken;
}

export function Box({
  padding,
  gap,
  background,
  radius,
  style,
  ...rest
}: BoxProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        padding !== undefined ? { padding: theme.spacing[padding] } : null,
        gap !== undefined ? { gap: theme.spacing[gap] } : null,
        background !== undefined ? { backgroundColor: theme.colors[background] } : null,
        radius !== undefined ? { borderRadius: theme.radii[radius] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
