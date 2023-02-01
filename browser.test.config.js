const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
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
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      fs: false,
    },
    alias: {
      '@ngageoint/projections-js': path.join(__dirname, './node_modules/@ngageoint/projections-js/dist/index.js'),
      '@ngageoint/simple-features-js': path.join(__dirname, '/node_modules/@ngageoint/simple-features-js/dist/index.js'),
      '@ngageoint/simple-features-proj-js': path.join(__dirname, '/node_modules/@ngageoint/simple-features-proj-js/dist/index.js'),
      '@ngageoint/simple-features-wkb-js': path.join(__dirname, '/node_modules/@ngageoint/simple-features-wkb-js/dist/index.js'),
      '@ngageoint/simple-features-wkt-js': path.join(__dirname, '/node_modules/@ngageoint/simple-features-wkt-js/dist/index.js'),
      '@ngageoint/simple-features-geojson-js': path.join(__dirname, '/node_modules/@ngageoint/simple-features-geojson-js/dist/index.js'),
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
  externals: ['better-sqlite3'],
};
