// rollup.config.js
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'index.js',
    output: {
      file: 'bundle.js',
      format: 'iife',
      name: 'reproject',
      interop: false,
      exports: 'named',
      globals: {
          proj4: 'proj4'
      }
    },
    external:  ['proj4'],
    plugins: [
        commonjs(),
        terser()
    ]
  }