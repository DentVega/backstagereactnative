# Coding Standards

> Applied during the Construction **Implement** stage.

## Skill precedence (read first)

These standards reflect **project decisions** and override any installed skill:

1. When a skill recommends something that **contradicts** these standards (or `tech-stack.md`), the **standards win**. Example: a skill suggesting Metro config — ignore it; we use Re.Pack.
2. When a skill **complements** these standards (e.g. an FPS optimization), follow it.
3. If a skill's advice would break an architectural rule (e.g. federation boundaries, native-module placement), do **not** apply it silently — raise it with the user.

## Performance skills — delimited triggers (avoid overlap)

| Skill | When | Role |
|---|---|---|
| `vercel-react-native-skills` | While **writing** RN components | Prescriptive RN ruleset (30+ rules). The default. |
| `react-native-best-practices` | While **debugging** a measured problem | Diagnostic/profiling (jank, leaks, frame drops, TTI). |
| `react-best-practices` (Vercel) | While writing **React-general** logic | Request waterfalls, re-renders, data-fetching patterns. |
| `composition-patterns` (Vercel) | While designing **reusable components** | Compound components, render props, avoid boolean-prop-hell. |

Do not invoke the two RN perf skills for the same task: authoring code → Vercel RN rules; chasing a perf bug → best-practices.

## Baseline rules (from the Vercel ruleset, summarized)
- Virtualize lists with **FlashList**; never map large arrays into a ScrollView.
- **Memoize** list items and stable callbacks; avoid inline objects/functions in hot render paths.
- Animate **only `transform` and `opacity`** (drive with Reanimated on the UI thread).
- Prefer **native navigators** over JS-driven navigation.
- Keep the host bundle lean — push heavy/optional features into **federated remote chunks** (Re.Pack).
- Pin shared singletons (react, react-native, nav, state) across federated chunks.

## Miniapp authoring rules (this project)
- Every miniapp exposes a **stable contract**: a typed entry component + a declared `shared` deps list + a manifest (id, version, permissions). No implicit host globals.
- A miniapp must **degrade gracefully** if a shared singleton version is incompatible — never crash the host.
- A miniapp is buildable **standalone** (for the Backstage web catalog preview) and **as a remote** (for the mobile host). Keep the two entrypoints in sync.

## Banking / security rules (this project)
- No secrets, tokens, or PAN/account data in logs, JS bundles, or chunk artifacts.
- Session/auth lives in the **host** only; miniapps receive scoped, revocable capabilities — never raw credentials.
- Treat every remote chunk URL and manifest as untrusted input: verify integrity/signature before mount (record the mechanism as an ADR).

## TypeScript / general
- Strict mode on. No `any` in domain code.
- Domain logic (Model stage output) lives separate from UI and is unit-tested.
