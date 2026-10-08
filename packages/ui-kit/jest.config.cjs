/** @type {import('jest').Config} */
module.exports = {
  preset: "react-native",
  testMatch: ["**/*.test.tsx", "**/*.test.ts"],
  // Los imports relativos llevan `.js` (ESM publicable); en jest apuntan al `.ts`/`.tsx`.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  // pnpm stores deps under node_modules/.pnpm/<pkg>@<ver>/... and encodes scoped
  // names as "@scope+name". The RN preset's default ignore pattern misses this, so
  // RN's Flow-typed source stays untransformed. Allow the RN family through babel.
  transformIgnorePatterns: [
    "node_modules/\\.pnpm/(?!(?:react-native|react-native-|@react-native\\+|@react-native-community\\+|@react-navigation\\+|@testing-library\\+))",
  ],
};
