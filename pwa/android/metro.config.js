// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  
  return {
    ...defaultConfig,
    transformer: {
      ...defaultConfig.transformer,
      babelTransformerPath: require.resolve('react-native-web/babel'),
    },
    resolver: {
      ...defaultConfig.resolver,
      sourceExts: [...defaultConfig.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'],
      platforms: ['web', 'android'],
    },
  };
})();
