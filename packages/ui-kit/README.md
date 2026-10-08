# @dentvega/ui-kit

Themed React Native primitives (`AppText`, `Box`, `Button`, `Card`) and design tokens
(`ThemeProvider`, `useTheme`, light/dark themes) for the miniapp host
[`backstagereactnative`](https://github.com/DentVega/backstagereactnative) and its miniapps.

The host bundles it and shares it as a **Module Federation singleton**: miniapps declare it as a
dependency for types and local dev, and at runtime they get the host's copy.

```bash
pnpm add @dentvega/ui-kit
```

`react` and `react-native` are peer dependencies. ESM only. MIT.
