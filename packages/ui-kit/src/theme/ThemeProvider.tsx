import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import type { Theme } from "./tokens";
import { resolveTheme } from "./resolveTheme";

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  /** Force a scheme; when omitted, follows the OS color scheme. */
  scheme?: "light" | "dark";
  children: React.ReactNode;
}

export function ThemeProvider({ scheme, children }: ThemeProviderProps): React.JSX.Element {
  const osScheme = useColorScheme();
  const active = scheme ?? (osScheme === "dark" ? "dark" : "light");
  const theme = useMemo(() => resolveTheme(active), [active]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Read the active theme. Throws if used outside a ThemeProvider. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return theme;
}
