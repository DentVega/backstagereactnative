/**
 * Config declarativo del dev-loop (`pnpm dev`). PLANTILLA.
 *
 * Copiala a `dev-miniapps.config.mjs` (gitignored) y editá los `path` a donde
 * clonaste/descargaste cada miniapp:
 *
 *   cp apps/host/dev-miniapps.config.example.mjs apps/host/dev-miniapps.config.mjs
 *
 * Campos por miniapp:
 *   id        id de la miniapp (= id de catálogo / manifest.json).
 *   path      ruta al repo de la miniapp — RELATIVA a la raíz del repo host
 *             (backstagereactnative) o ABSOLUTA. La mantenés vos.
 *   mode      'mount'  → dev-mount: va al bundle del host, Fast Refresh (en el picker).
 *             'remote' → dev server federado en su `port` (prueba federación real).
 *   port      requerido si mode:'remote' (único por miniapp).
 *   autostart si arranca prendida. En remotes = autostart de su dev server (lo
 *             prendés/apagás en vivo desde el TUI de mprocs).
 */
export const devMiniapps = [
  {id: 'hellow_widget', path: '../miniapp-hellow_widget', mode: 'mount', autostart: true},
  {id: 'cards_wallet', path: '../miniapp-cards_wallet', mode: 'remote', port: 9000, autostart: true},
  {
    id: 'account_dashboard',
    path: '../miniapp-account-dashboard',
    mode: 'remote',
    port: 9001,
    autostart: false,
  },
];

/**
 * (Opcional) El control-plane Backstage, para que `pnpm dev` también lo levante y el
 * Home/catálogo cargue. Borrá este export si lo corrés por tu cuenta.
 *   path       ruta al repo backstage-web (relativa a la raíz del repo host, o absoluta).
 *   port       puerto del `next dev` (default 3999 — el host lo espera ahí).
 *   autostart  si arranca prendido (togglable en el TUI de mprocs).
 */
export const backstage = {path: '../backstage-web', port: 3999, autostart: true};
