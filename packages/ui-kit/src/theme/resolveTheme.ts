import { lightTheme } from "./light.js";
import { darkTheme } from "./dark.js";
import type { Theme } from "./tokens.js";

/** Deterministic palette selection (pure, unit-testable). */
export function resolveTheme(scheme: "light" | "dark"): Theme {
  return scheme === "dark" ? darkTheme : lightTheme;
}
