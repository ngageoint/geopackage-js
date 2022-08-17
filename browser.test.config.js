const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  entry: './test/browserTests.js',
  plugins: [
    new NodePolyfillWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: 'canvaskit/*',
          to: '.',
        },
        {
          from: 'node_modules/rtree-sql.js/dist/sql-wasm.wasm',
          to: '..',
        },
        {
          from: 'node_modules/mocha/*',
          to: '..',
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      fs: false,
    },
  },
  output: {
    filename: 'browser.test.bundle.js',
    path: path.resolve(__dirname, 'test', 'bundle'),
    library: {
      name: 'geopackage',
      type: 'umd',
    },
  },
  devtool: 'source-map',
};
