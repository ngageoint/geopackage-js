# CanvasKit + Web Assembly Custom Build
* CanvasKit: 0.25.1
* EMScript: 2.0.20

# Build Instructions
* Install emscripten
  * ```git clone https://github.com/emscripten-core/emsdk.git```
  * ```cd emsdk```
  * ```./emsdk install latest```
  * ```./emsdk activate latest```
  * ```source ./emsdk_env.sh```
* Install depot_tools
  * ```git clone 'https://chromium.googlesource.com/chromium/tools/depot_tools.git'```
  * ```export PATH="${PWD}/depot_tools:${PATH}"```
* Install google skia and checkout latest tagged version
  * ```git clone https://skia.googlesource.com/skia.git```
  * ```cd skia```
  * ```python2 tools/git-sync-deps```
  * ```git checkout canvaskit/0.25.1```
* Build stripped down version of CanvasKit for GeoPackage
  * ```cd modules/canvaskit```
  * ```./compile.sh release no_skottie no_particles no_rt_shader no_paragraph no_woff2 no_alias_font no_effects_deserialization no_skp_serialization```
* Copy CanvasKit js/wasm files to geopackage library
  * ```cd ../../out/canvaskit_wasm```
  * ```cp canvaskit.js /path/to/geopackage_root/canvaskit/```
  * ```cp canvaskit.wasm /path/to/geopackage_root/canvaskit/```
