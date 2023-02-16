## Development

### Setup
1. Install python
2. Install node version 16+
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
  * browser entry: geopackage.min.js
  * browser license: geopackage.min.js.LICENSE.txt
  * node entry: index.js, lib
  * types: index.d.ts, lib
  * sql.js wasm: sql-wasm.wasm
  * canvaskit js: canvaskit/canvaskit.js
  * canvaskit wasm: canvaskit/canvaskit.wasm
