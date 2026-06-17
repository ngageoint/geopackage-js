const path = require('path');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
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
            configFile: './tsconfig.json',
          },
        },
        exclude: /node_modules/,
      },
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
    filename: 'geopackage.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'GeoPackage',
      type: 'umd',
    },
  },
  externals: ['better-sqlite3']
};