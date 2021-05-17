const path = require('path');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

const browserConfig = {
  entry: './index.ts',
  plugins: [
    // new BundleAnalyzerPlugin({analyzerMode: 'static'}),
    new NodePolyfillWebpackPlugin(),
    // copy
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/rtree-sql.js/dist/sql-wasm.wasm',
          to: '.',
        },
        {
          from: 'canvaskit/*',
          to: '.',
        },
      ],
    }),
  ],
  target: 'web',
  module: {
    noParse: /node_modules\/rtree-sql\.js\/dist\/sql-wasm\.js$/,
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: "./tsconfig.json"
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      'fs': false
    },
  },
  output: {
    filename: 'geopackage.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'GeoPackage',
      type: 'umd'
    },
  },
  externals: ['better-sqlite3'],
  devtool: 'source-map',
  mode: 'production'
};

module.exports = [browserConfig];
