module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime'],
    ['@babel/plugin-proposal-class-properties'],
    process.env.NODE_ENV === 'production' && require('./babel-plugins/tree-shake'),
  ].filter(Boolean),
  env: {
    production: {
      plugins: [
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
        ['transform-react-remove-prop-types', { removeImport: true }],
      ],
    },
  },
};
