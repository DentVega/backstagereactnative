/** @type {import('jest').Config} */
module.exports = {
  preset: "react-native",
  testMatch: ["**/*.test.tsx", "**/*.test.ts"],
  transformIgnorePatterns: [
    "node_modules/\\.pnpm/(?!(?:react-native|react-native-|@react-native\\+|@react-native-community\\+|@react-navigation\\+|@testing-library\\+))",
  ],
};
