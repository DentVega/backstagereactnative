/**
 * Genera el Host Contract (host-contract.json) desde la fuente única SHARED_DEPS
 * + las versiones instaladas. nativeModules se puebla vía autolinking (`react-native config`).
 * Uso: node scripts/gen-host-contract.mjs   (escribe apps/host/host-contract.json)
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SHARED_DEPS } from "../shared-deps.mjs";

const require = createRequire(import.meta.url);
const pkgVersion = (name) => require(`${name}/package.json`).version;

/** Construye el HostContract (pura, testeable). */
export function buildHostContract(deps, resolveVersion, { contractVersion, nativeModules = [] }) {
  const shared = {};
  for (const d of deps) shared[d.name] = resolveVersion(d.name);
  return {
    contractVersion,
    reactNative: resolveVersion("react-native"),
    shared,
    nativeModules,
  };
}

/**
 * Extrae los módulos nativos autolinkeados del output de `react-native config`.
 * Un dep es nativo si tiene config de plataforma (android o ios) no-null — o sea,
 * código nativo que debe estar compilado en el binario del host.
 */
export function parseAutolinkedNatives(rnConfig) {
  const deps = rnConfig?.dependencies ?? {};
  return Object.entries(deps)
    .filter(([, d]) => {
      const p = d?.platforms ?? {};
      return (p.android != null) || (p.ios != null);
    })
    .map(([name]) => name);
}

/**
 * Fail-loud: un `nativeModules` vacío casi siempre significa que `react-native config`
 * falló o el autolinking no detectó nada. Publicar un contract con [] haría que TODA
 * miniapp con un módulo nativo sea marcada incompatible (falso positivo del gate).
 * Abortá salvo que el host realmente no tenga nativos (`ALLOW_NO_NATIVES=1`).
 */
export function requireNativeModules(nativeModules, allowEmpty) {
  if (nativeModules.length === 0 && !allowEmpty) {
    throw new Error(
      "gen-host-contract: no native modules detected — un contract con nativeModules vacío " +
        "rompería el gate de compat (toda miniapp con un nativo quedaría incompatible). " +
        "Si el host REALMENTE no tiene nativos, corré con ALLOW_NO_NATIVES=1.",
    );
  }
  return nativeModules;
}

// --- CLI ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hostPkg = JSON.parse(readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const contractVersion = process.env.CONTRACT_VERSION ?? hostPkg.version ?? "1.0.0";

// El bloque CLI solo corre cuando se ejecuta directo (no al importar en tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  // Enumerar los módulos nativos del host (autolinking). Best-effort: si falla, [].
  let nativeModules = [];
  try {
    const raw = execSync("pnpm exec react-native config", {
      cwd: path.join(__dirname, ".."),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    nativeModules = parseAutolinkedNatives(JSON.parse(raw));
  } catch (err) {
    console.warn(`gen-host-contract: react-native config failed (${err})`);
  }
  // Fail-loud: no publicar un contract con nativeModules vacío (falso positivo del gate).
  try {
    nativeModules = requireNativeModules(nativeModules, process.env.ALLOW_NO_NATIVES === "1");
  } catch (err) {
    console.error(String(err?.message ?? err));
    process.exit(1);
  }
  const contract = buildHostContract(SHARED_DEPS, pkgVersion, { contractVersion, nativeModules });
  const out = path.join(__dirname, "..", "host-contract.json");
  writeFileSync(out, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  console.log(
    `wrote ${out} (contractVersion ${contractVersion}, rn ${contract.reactNative}, nativeModules ${contract.nativeModules.length})`
  );
}
