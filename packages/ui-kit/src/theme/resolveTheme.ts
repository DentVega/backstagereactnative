import { lightTheme } from "./light";
import { darkTheme } from "./dark";
import type { Theme } from "./tokens";

/** Deterministic palette selection (pure, unit-testable). */
export function resolveTheme(scheme: "light" | "dark"): Theme {
  return scheme === "dark" ? darkTheme : lightTheme;
}
