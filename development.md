## Development

### Setup
1. Install python
2. Install node version 14+
3. npm install

### Test in node context
1. npm run test-node

### Test in browser context
1. npm run build-browser-test
2. cd ./test
3. python -m SimpleHTTPServer
4. open browser and navigate to http://localhost:8080/index.html

### CanvasKit
CanvasKit + WebAssembly is used for canvas operations in Node.js environments. A custom version of the wasm is used and 
should be rebuilt when canvaskit-wasm has updated releases.

see ./canvaskit/README.md for more instructions

### Build
1. npm run build

The geopackage build will generate several files in the dist directory. 
* dist/browser
  * bundle: index.min.js
  * license: index.min.js.LICENSE.txt
  * types: index.d.ts, lib
  * sql.js wasm: sql-wasm.wasm
* dist/node
  * bundle: index.node.min.js
  * license: index.node.min.js.LICENSE.txt
  * types: index.node.d.ts, lib
  * canvaskit wasm: canvaskit.wasm
