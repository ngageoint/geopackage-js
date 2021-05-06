const path = require('path');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

const browserConfig = {
  entry: './index.ts',
  plugins: [
    // new BundleAnalyzerPlugin({analyzerMode: 'static'}),
    new NodePolyfillWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/rtree-sql.js/dist/sql-wasm.wasm',
          to: '.',
        },
      ],
    }),
  ],
  target: 'web',
  module: {
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
      "fs": false,
    },
  },
  output: {
    filename: 'index.min.js',
    path: path.resolve(__dirname, 'dist', 'browser'),
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
  mode: 'production'
};

const nodeConfig = {
  entry: './index.node.ts',
  plugins: [
    // new BundleAnalyzerPlugin({analyzerMode: 'static'}),
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/canvaskit-wasm/bin/canvaskit.wasm',
          to: '.',
        },
      ],
    }),
  ],
  target: "node",
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: "./tsconfig.node.json"
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: ['better-sqlite3'],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.node.min.js',
    path: path.resolve(__dirname, 'dist', 'node'),
    libraryTarget: 'commonjs2',
  },
  devtool: 'source-map',
  mode: 'production'
};

module.exports = [browserConfig, nodeConfig];
