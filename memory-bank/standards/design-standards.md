# Design Standards

> Read during the Construction **Design** and **Implement** stages. Defines the
> visual system so screens are consistent and theming isn't retrofitted late
> (which costs a whole "design-parity" bolt if left to the end).

## Design tokens (single source of truth)
Define tokens once; never hardcode raw values in components.
- **Color:** semantic names, not raw hex — `background`, `surface`, `text`, `textMuted`, `primary`, `danger`, `border`. Map each to a light and dark value.
- **Spacing:** a fixed scale (e.g. `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32`). No arbitrary margins.
- **Typography:** a scale (e.g. `caption · body · title · heading · display`) with size + weight + line-height.
- **Radii / elevation:** a small fixed set.
- Store tokens in `src/theme/` (`tokens.ts` + `light.ts` / `dark.ts`).

## Theming (light/dark from day one)
- A single **ThemeProvider** exposes the active theme; components read tokens via a hook (`useTheme()`), never import a raw palette.
- Respect the OS color scheme by default; allow an in-app override.
- **Never hardcode a color/spacing value in a screen** — if you're typing a hex or a number, add/΅use a token instead.

## Themed primitives (not raw RN components)
- Wrap raw `Text` / `View` / `Pressable` in themed primitives (`AppText`, `Box`, `Button`, `Card`) that consume tokens. Screens compose primitives, not raw components with inline styles.
- This is what makes a later theme change (e.g. light→dark, rebrand) a token edit, not a screen-by-screen rewrite.

## Styling approach
- Pick one and record it in `tech-stack.md`: **NativeWind** (Tailwind classes mapped to tokens) or **StyleSheet + tokens**. Do not mix ad-hoc.
- Co-locate styles with the component; no global stylesheets.

## Accessibility (baseline, not optional)
- Minimum touch target **44×44 pt**.
- Every interactive element has an accessible label/role; images that convey meaning have `accessibilityLabel`.
- Text respects Dynamic Type / font scaling — avoid fixed heights that clip scaled text.
- Meet WCAG AA contrast for text on its background (check both themes).

## Motion
- Animate only `transform` and `opacity`, on the UI thread (Reanimated) — see `coding-standards.md`. Respect "reduce motion".

## Fill in per project
- Icon set: `<lucide-react-native / other>`.
- Font family: `<system / embedded>` (embedding custom fonts is a native step — plan it).
- Brand palette source: `<where the brand colors come from>`.
