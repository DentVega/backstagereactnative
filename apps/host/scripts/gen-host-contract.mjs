/**
 * Genera el Host Contract (host-contract.json) desde la fuente única SHARED_DEPS
 * + las versiones instaladas. nativeModules queda [] hasta Fase 2 (autolinking).
 * Uso: node scripts/gen-host-contract.mjs   (escribe apps/host/host-contract.json)
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SHARED_DEPS } from "../shared-deps.mjs";

const require = createRequire(import.meta.url);
const pkgVersion = (name) => require(`${name}/package.json`).version;

/** Construye el HostContract (pura, testeable). */
export function buildHostContract(deps, resolveVersion, { contractVersion }) {
  const shared = {};
  for (const d of deps) shared[d.name] = resolveVersion(d.name);
  return {
    contractVersion,
    reactNative: resolveVersion("react-native"),
    shared,
    nativeModules: [],
  };
}

// --- CLI ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hostPkg = JSON.parse(readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const contractVersion = process.env.CONTRACT_VERSION ?? hostPkg.version ?? "1.0.0";

// El bloque CLI solo corre cuando se ejecuta directo (no al importar en tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const contract = buildHostContract(SHARED_DEPS, pkgVersion, { contractVersion });
  const out = path.join(__dirname, "..", "host-contract.json");
  writeFileSync(out, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  console.log(`wrote ${out} (contractVersion ${contractVersion}, rn ${contract.reactNative})`);
}
