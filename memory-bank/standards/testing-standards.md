# Testing Standards

> Applied during the Construction **Test** stage. Two layers, two skills — complementary, not overlapping.

## Layer 1 — Component / unit tests (`react-native-testing-library`)
- Tooling: Jest + React Native Testing Library (skill auto-detects v13/v14).
- **Query priority:** `getByRole` > accessible queries > `getByTestId` (last resort).
- Use the **`userEvent`** API for interactions (not raw `fireEvent`) where possible.
- v14: `render` is async — `await` it; `fireEvent` semantics changed.
- **Anti-patterns to avoid:** wrapping everything in `act()`; putting side effects inside `waitFor`.
- Matchers: `toBeOnTheScreen`, `toBeVisible`, etc.
- Test **domain logic** (Model output) as plain unit tests, no renderer needed.

## Layer 2 — Device E2E / smoke (`agent-device`)
- Drives a real simulator/emulator across iOS / Android / tvOS / macOS: snapshot → extract elements → tap/scroll/type.
- Uses **reference-based targeting** (not raw coordinates); handles RN debug overlays + keyboard.
- **Inspect (read-only) before acting.**
- Use for flows that need a real device surface and for **Re.Pack-specific checks**: a remote chunk downloads and mounts, and the fallback path works when it can't.

## When to use which
- Logic & component behavior → Layer 1 (fast, runs in CI).
- End-to-end flows, federation loading, native surfaces → Layer 2.
- A bolt is "done" only when Layer 1 passes; run Layer 2 for user-facing flows before handing off to Operations.

## Minimum per bolt (hard rule)
- **Every screen bolt ships at least one RNTL component test** for its main screen/flow — a screen bolt without one is NOT done, even if `tsc` and the bundle are green. (Test debt drifts silently otherwise: a real 15-bolt cycle ended with zero component tests.)
- Domain-logic bolts ship plain unit tests for their pure functions.

## Project-specific (miniapp / federation / banking)
- **Miniapp mount test (Layer 2):** every miniapp bolt proves the remote chunk downloads, mounts in the host, and the **fallback path** works when the chunk is unreachable or fails signature verification.
- **Contract test:** a miniapp's typed entry + declared `shared` list is verified against the host's provided singletons (version-skew guard).
- **Backstage web:** the catalog/registry gets its own web tests (component + API); a published miniapp must be resolvable end-to-end (register → publish → host resolves URL).
- **Security smoke:** login/session and any money-movement flow get a Layer 2 device pass before Operations — no scoped-capability leak into miniapps.
