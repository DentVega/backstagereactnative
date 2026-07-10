module.exports = {
  preset: 'react-native',
  // pnpm stores deps under node_modules/.pnpm/<pkg>@<ver>/... (scopes encoded as
  // "@scope+name"). Let the RN family through babel; ignore everything else.
  transformIgnorePatterns: [
    'node_modules/\\.pnpm/(?!(?:react-native|react-native-|@react-native\\+|@react-native-community\\+|@react-navigation\\+|@testing-library\\+))',
  ],
};
