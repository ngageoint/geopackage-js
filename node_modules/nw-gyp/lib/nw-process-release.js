var semver = require('semver')
  , url = require('url')
  , path = require('path')

// Captures all the logic required to determine download URLs, local directory and 
// file names. Inputs come from command-line switches (--target, --dist-url).
function processRelease (argv, gyp/*, defaultVersion, defaultRelease*/) {
  // nw-gyp: `defaultVersion` and `defaultRelease` are meaningless for NW.js
  var version = (semver.valid(argv[0]) && argv[0]) || gyp.opts.target
    , versionSemver = semver.parse(version)
    , overrideDistUrl = gyp.opts['dist-url'] || gyp.opts.disturl
    , distBaseUrl
    , baseUrl
    , libUrl32
    , libUrl64
    , nodeLibUrl32
    , nodeLibUrl32
    , tarballUrl
    , canGetHeaders

  if (!versionSemver) {
    // not a valid semver string, nothing we can do
    return { version: version }
  }
  // flatten version into String
  version = versionSemver.version

  // nw-gyp: `overrideDistUrl` should be redirected to NW.js by default
  if (!overrideDistUrl) {
    overrideDistUrl = 'http://node-webkit.s3.amazonaws.com';
  }

  distBaseUrl = overrideDistUrl.replace(/\/+$/, '')

  distBaseUrl += '/v' + version + '/'

  baseUrl = distBaseUrl
  nodeLibUrl32 = resolveLibUrl('node', baseUrl, 'ia32', versionSemver.major)
  nodeLibUrl64 = resolveLibUrl('node', baseUrl, 'x64', versionSemver.major)
  libUrl32 = resolveLibUrl('nw', baseUrl, 'ia32', versionSemver.major)
  libUrl64 = resolveLibUrl('nw', baseUrl, 'x64', versionSemver.major)

  tarballUrl = url.resolve(baseUrl, 'nw-headers-v' + version + '.tar.gz')

  return {
    version: version,
    semver: versionSemver,
    name: 'nw',
    baseUrl: baseUrl,
    tarballUrl: tarballUrl,
    shasumsUrl: url.resolve(baseUrl, 'SHASUMS256.txt'),
    versionDir: version,
    libUrl32: libUrl32,
    libUrl64: libUrl64,
    nodeLibUrl32: nodeLibUrl32,
    nodeLibUrl64: nodeLibUrl64,
    libPath32: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl32).path)),
    libPath64: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl64).path)),
    nodeLibPath32: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(nodeLibUrl32).path)),
    nodeLibPath64: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(nodeLibUrl64).path))
  }
}

function normalizePath (p) {
  return path.normalize(p).replace(/\\/g, '/')
}

function resolveLibUrl (name, defaultUrl, arch, versionMajor) {
  if (arch === 'ia32') {
    return url.resolve(defaultUrl, name + '.lib');
  } else {
    return url.resolve(defaultUrl, arch + '/' + name + '.lib')
  }
}

module.exports = processRelease
