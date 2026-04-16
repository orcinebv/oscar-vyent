const { NxWebpackPlugin } = require('@nx/webpack');
const { join } = require('path');

module.exports = {
  target: 'node',
  context: __dirname,
  entry: './src/main.ts',
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    filename: 'main.js',
  },
  plugins: [
    new NxWebpackPlugin({
      tsConfig: './tsconfig.app.json',
      compiler: 'tsc',
      target: 'node',
      outputHashing: 'none',
      optimization: false,
    }),
  ],
};
