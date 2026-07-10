/** Design tokens — single source of truth (design-standards.md). */

export type ColorToken =
  | "background"
  | "surface"
  | "text"
  | "textMuted"
  | "primary"
  | "danger"
  | "border";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;
export type SpacingToken = keyof typeof spacing;

export const radii = { sm: 4, md: 8, lg: 16 } as const;
export type RadiusToken = keyof typeof radii;

export const typography = {
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 22 },
  title: { fontSize: 20, fontWeight: "600", lineHeight: 26 },
  heading: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  display: { fontSize: 40, fontWeight: "800", lineHeight: 46 },
} as const;
export type TypeToken = keyof typeof typography;

export interface Theme {
  readonly scheme: "light" | "dark";
  readonly colors: Readonly<Record<ColorToken, string>>;
  readonly spacing: typeof spacing;
  readonly radii: typeof radii;
  readonly typography: typeof typography;
}
