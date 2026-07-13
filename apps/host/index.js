/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {setupScriptManager} from './src/chunkLoader';
import App from './App';
import {name as appName} from './app.json';

// Register the Module Federation / ScriptManager resolver up front so the
// lazily-loaded `account_dashboard` remote (and any local split chunk) resolves
// when requested. Host-used shared deps are `eager` in rspack.config.mjs, so
// they are in the initial bundle and registration below stays synchronous —
// no async boundary, no AppRegistry race.
setupScriptManager();

AppRegistry.registerComponent(appName, () => App);
