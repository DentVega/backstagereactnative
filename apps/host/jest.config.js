module.exports = {
  preset: 'react-native',
  // pnpm stores deps under node_modules/.pnpm/<pkg>@<ver>/... (scopes encoded as
  // "@scope+name"). Let the RN family through babel; ignore everything else.
  transformIgnorePatterns: [
    'node_modules/\\.pnpm/(?!(?:react-native|react-native-|@react-native\\+|@react-native-community\\+|@react-navigation\\+|@testing-library\\+|@noble\\+|@dentvega\\+))',
  ],
  // ui-kit (workspace) importa con `.js` explícito; en jest apunta al `.ts`/`.tsx`.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/scripts/'],
};
