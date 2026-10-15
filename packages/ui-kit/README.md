# @dentvega/ui-kit

The design system shared by the miniapp host
[`backstagereactnative`](https://github.com/DentVega/backstagereactnative) and its miniapps:
design tokens, light/dark themes and a few themed React Native primitives.

The host bundles it and shares it as a **Module Federation singleton**: there is one copy in
memory (the host's), and every miniapp renders with it. That keeps all miniapps visually
consistent and switching light/dark together. Miniapps declare it as a dependency for types and
local development; at runtime they get the host's copy.

## Install

```bash
pnpm add @dentvega/ui-kit
```

`react` and `react-native` are peer dependencies. ESM only. MIT.

## Usage

Wrap your app (or the miniapp's root in standalone dev) in a `ThemeProvider`, then build with the
primitives:

```tsx
import { ThemeProvider, Box, Card, AppText, Button } from "@dentvega/ui-kit";

export function App() {
  return (
    <ThemeProvider>
      <Box padding="lg" gap="md" background="background">
        <AppText variant="heading">Accounts</AppText>
        <Card>
          <AppText variant="title">Checking</AppText>
          <AppText color="textMuted">**** 1234</AppText>
        </Card>
        <Button label="Transfer" onPress={() => {}} />
      </Box>
    </ThemeProvider>
  );
}
```

`ThemeProvider` follows the OS color scheme; pass `scheme="light"` or `scheme="dark"` to force
one. Read the active theme anywhere below it with `useTheme()` (it throws outside a provider).

## Primitives

| Component | Props (besides the React Native ones) |
| --- | --- |
| `AppText` | `variant?: "caption" \| "body" \| "title" \| "heading" \| "display"`, `color?: ColorToken` |
| `Box` | `padding?`, `gap?` (spacing tokens), `background?: ColorToken`, `radius?` (radius token) |
| `Card` | Surface with border, `lg` radius, `lg` padding and a soft shadow |
| `Button` | `label: string`, `variant?: "primary" \| "danger"`; 44×44 minimum touch target, dimmed when disabled |

## Tokens

| Token | Values |
| --- | --- |
| Colors (`ColorToken`) | `background`, `surface`, `text`, `textMuted`, `primary`, `danger`, `border` |
| `spacing` | `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `2xl` 32 |
| `radii` | `sm` 4 · `md` 8 · `lg` 16 |
| `typography` | `caption` 12 · `body` 16 · `title` 20 · `heading` 28 · `display` 40 |

`lightTheme`, `darkTheme` and `resolveTheme(scheme)` are exported for use outside React (tests,
static styles).

## Versioning with the host

The host publishes the ui-kit version it ships in its platform contract. A miniapp must require
a compatible range (for example `^0.1.0`): the platform's compatibility gate blocks publishing a
miniapp whose range the host can't satisfy.

## License

MIT
