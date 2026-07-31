/**
 * Gate de gobernanza del host: valida que un cambio de deps del host NO rompa la
 * flota de miniapps publicadas (blast-radius). "Breaking" = una miniapp compatible
 * con el contract PUBLICADO que pasa a incompatible con el CANDIDATO (del PR).
 * Rollout-safe: sin contract publicado → skip. Override: ACCEPT_BREAKING=true.
 * Uso (CI del host, en PRs de deps): BACKSTAGE_URL=... node scripts/check-host-compat.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkCompatibility } from "@dentvega/miniapp-contract";

/** Miniapps que pasan de compatible (publicado) → incompatible (candidato). */
export function findNewlyBroken(publishedContract, candidateContract, manifests) {
  const broken = [];
  for (const m of manifests) {
    const shared = m.shared ?? [];
    const natives = m.nativeModules ?? [];
    const was = checkCompatibility(publishedContract, shared, natives).compatible;
    const now = checkCompatibility(candidateContract, shared, natives).compatible;
    if (was && !now) {
      const report = checkCompatibility(candidateContract, shared, natives);
      const reason = [
        ...report.skew.entries.filter((e) => e.status !== "ok").map((e) => `${e.name} (${e.status})`),
        ...report.native.missing.map((n) => `${n} (native missing)`),
      ].join("; ");
      broken.push({ id: m.id, reason });
    }
  }
  return broken;
}

// --- CLI ---
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const baseUrl = process.env.BACKSTAGE_URL;
  const acceptBreaking = process.env.ACCEPT_BREAKING === "true";
  if (!baseUrl) { console.error("BACKSTAGE_URL is required"); process.exit(1); }
  const api = baseUrl.replace(/\/+$/, "");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Contract candidato = el que generaría este PR (corre el generador real).
  execSync("node scripts/gen-host-contract.mjs", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  const candidate = JSON.parse(readFileSync(path.join(__dirname, "..", "host-contract.json"), "utf8"));

  // Baseline: el contract publicado. Sin él no hay transición que medir → skip.
  let published = null;
  try {
    const res = await fetch(`${api}/api/host-contract`);
    if (res.ok) published = await res.json();
  } catch (err) { console.warn(`check-host-compat: contract fetch failed (${err})`); }
  if (!published) { console.warn("check-host-compat: no published contract — skipping (no baseline)"); process.exit(0); }

  // Flota.
  let manifests = [];
  try {
    const res = await fetch(`${api}/api/manifests`);
    if (res.ok) manifests = (await res.json()).manifests ?? [];
  } catch (err) { console.warn(`check-host-compat: manifests fetch failed (${err}) — skipping`); process.exit(0); }

  const broken = findNewlyBroken(published, candidate, manifests);
  if (broken.length === 0) {
    console.log(`check-host-compat: OK — candidate breaks 0 of ${manifests.length} published miniapp(s)`);
    process.exit(0);
  }
  const detail = broken.map((b) => `${b.id}: ${b.reason}`).join("\n  ");
  const msg = `check-host-compat: this change BREAKS ${broken.length} published miniapp(s):\n  ${detail}`;
  if (acceptBreaking) { console.warn(`${msg}\n[ACCEPT_BREAKING=true → allowed with record]`); process.exit(0); }
  console.error(`${msg}\n[migrate them, or add the 'accept-breaking-contract' label to override]`);
  process.exit(1);
}
