"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  TraceurLoader: {
    enumerable: true,
    get: function() {
      return TraceurLoader;
    }
  },
  BrowserTraceurLoader: {
    enumerable: true,
    get: function() {
      return BrowserTraceurLoader;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__7 = require("../util/url.js"),
    isAbsolute = $__7.isAbsolute,
    resolveUrl = $__7.resolveUrl;
var Loader = require("./Loader.js").Loader;
var LoaderCompiler = require("./LoaderCompiler.js").LoaderCompiler;
var Options = require("../Options.js").Options;
var systemjs = require("./system-map.js").systemjs;
var webLoader = require("./webLoader.js").webLoader;
var version = require("./version.js").version;
var WebPageTranscoder = require("../WebPageTranscoder.js").WebPageTranscoder;
var uniqueNameCount = 0;
var TraceurLoader = function($__super) {
  function TraceurLoader(fileLoader, baseURL) {
    var loaderCompiler = arguments[2] !== (void 0) ? arguments[2] : new LoaderCompiler();
    $__superConstructor(TraceurLoader).call(this, loaderCompiler);
    this.fileLoader_ = fileLoader;
    this.baseURL_ = baseURL && String(baseURL);
    this.moduleStore_ = $traceurRuntime.ModuleStore;
  }
  return ($__createClass)(TraceurLoader, {
    get baseURL() {
      return this.baseURL_;
    },
    set baseURL(value) {
      this.baseURL_ = String(value);
    },
    get: function(normalizedName) {
      return this.moduleStore_.get(normalizedName);
    },
    set: function(normalizedName, module) {
      this.moduleStore_.set(normalizedName, module);
    },
    normalize: function(name, referrerName, referrerAddress) {
      var normalizedName = this.moduleStore_.normalize(name, referrerName, referrerAddress);
      if (typeof systemjs !== 'undefined' && System.map)
        return systemjs.applyMap(System.map, normalizedName, referrerName);
      return normalizedName;
    },
    locate: function(load) {
      load.metadata.traceurOptions = load.metadata.traceurOptions || {};
      var url = load.normalizedName;
      var options = load.metadata.traceurOptions;
      var baseURL = load.metadata && load.metadata.baseURL;
      baseURL = baseURL || this.baseURL;
      var referrer = options && options.referrer;
      if (referrer) {
        var minChars = Math.min(referrer.length, baseURL.length);
        var commonChars = 0;
        for (var i = 0; i < minChars; i++) {
          var aChar = referrer[referrer.length - 1 - i];
          if (aChar === baseURL[baseURL.length - 1 - i])
            commonChars++;
          else
            break;
        }
        if (commonChars) {
          var packageName = referrer.slice(0, -commonChars);
          var rootDirectory = baseURL.slice(0, -commonChars);
          if (url.indexOf(packageName) === 0) {
            url = url.replace(packageName, rootDirectory);
          }
        }
      }
      if (!isAbsolute(url)) {
        if (baseURL) {
          load.metadata.baseURL = baseURL;
          url = resolveUrl(baseURL, url);
        }
      }
      return url;
    },
    sourceName: function(load) {
      var options = load.metadata.traceurOptions;
      var sourceName = load.address;
      if (options.sourceMaps) {
        var sourceRoot = this.baseURL;
        if (sourceName) {
          if (sourceRoot && sourceName.indexOf(sourceRoot) === 0) {
            sourceName = sourceName.substring(sourceRoot.length);
          }
        } else {
          sourceName = this.baseURL + String(uniqueNameCount++);
        }
      }
      return sourceName;
    },
    nameTrace: function(load) {
      var trace = '';
      if (load.metadata.locateMap) {
        trace += this.locateMapTrace(load);
      }
      var base = load.metadata.baseURL || this.baseURL;
      if (base) {
        trace += this.baseURLTrace(base);
      } else {
        trace += 'No baseURL\n';
      }
      return trace;
    },
    locateMapTrace: function(load) {
      var map = load.metadata.locateMap;
      return ("locate found \'" + map.pattern + "\' -> \'" + map.replacement + "\'\n");
    },
    baseURLTrace: function(base) {
      return 'locate resolved against base \'' + base + '\'\n';
    },
    fetch: function(load) {
      var $__2 = this;
      return new Promise(function(resolve, reject) {
        if (!load)
          reject(new TypeError('fetch requires argument object'));
        else if (!load.address || typeof load.address !== 'string')
          reject(new TypeError('fetch({address}) missing required string.'));
        else
          $__2.fileLoader_.load(load.address, resolve, reject);
      });
    },
    translate: function(load) {
      return load.source;
    },
    instantiate: function($__3) {
      var $__4 = $__3,
          name = $__4.name,
          metadata = $__4.metadata,
          address = $__4.address,
          source = $__4.source,
          sourceMap = $__4.sourceMap;
      return new Promise(function(resolve, reject) {
        resolve(undefined);
      });
    },
    bundledModule: function(name) {
      return this.moduleStore_.bundleStore[name];
    },
    importAll: function(names) {
      var $__3 = arguments[1] !== (void 0) ? arguments[1] : {},
          referrerName = $__3.referrerName,
          address = $__3.address,
          metadata = $__3.metadata;
      var $__2 = this;
      return Promise.all(names.map(function(name) {
        return $__2.import(name, {
          referrerName: referrerName,
          address: address,
          metadata: metadata
        });
      }));
    },
    loadAsScript: function(name) {
      var $__4;
      var $__3 = arguments[1] !== (void 0) ? arguments[1] : {},
          referrerName = $__3.referrerName,
          address = $__3.address,
          metadata = ($__4 = $__3.metadata) === void 0 ? {} : $__4;
      metadata.traceurOptions = metadata.traceurOptions || {};
      metadata.traceurOptions.script = true;
      return this.internalLoader_.load(name, referrerName, address, metadata).then(function(load) {
        return load.result;
      });
    },
    loadAsScriptAll: function(names) {
      var $__3 = arguments[1] !== (void 0) ? arguments[1] : {},
          referrerName = $__3.referrerName,
          address = $__3.address,
          metadata = $__3.metadata;
      var $__2 = this;
      return Promise.all(names.map(function(name) {
        return $__2.loadAsScript(name, {
          referrerName: referrerName,
          address: address,
          metadata: metadata
        });
      }));
    },
    script: function(source) {
      var $__3 = arguments[1] !== (void 0) ? arguments[1] : {},
          name = $__3.name,
          referrerName = $__3.referrerName,
          address = $__3.address,
          metadata = $__3.metadata;
      return this.internalLoader_.script(source, name, referrerName, address, metadata);
    },
    semVerRegExp_: function() {
      return /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
    },
    semverMap: function(normalizedName) {
      var slash = normalizedName.indexOf('/');
      if (slash < 0) {
        slash = normalizedName.length;
      }
      var versionPart = normalizedName.slice(0, slash);
      var at = versionPart.indexOf('@');
      if (at !== -1) {
        var semver = versionPart.slice(at + 1);
        var m = this.semVerRegExp_().exec(semver);
        if (m) {
          var major = m[1];
          var minor = m[2];
          var packageName = versionPart.slice(0, at);
          var map = Object.create(null);
          map[packageName] = versionPart;
          map[packageName + '@' + major] = versionPart;
          map[packageName + '@' + major + '.' + minor] = versionPart;
          return map;
        }
        throw new Error('semverMap found no matching semver regexp in ' + semver);
      }
      throw new Error('semverMap expected name@semver, got ' + versionPart + ' ' + normalizedName);
    },
    get version() {
      return version;
    },
    getSourceMap: function(filename) {
      return this.internalLoader_.getSourceMap(filename);
    },
    register: function(normalizedName, deps, factoryFunction) {
      $traceurRuntime.ModuleStore.register(normalizedName, deps, factoryFunction);
    },
    registerModule: function(normalizedName, deps, factoryFunction) {
      $traceurRuntime.ModuleStore.registerModule(normalizedName, deps, factoryFunction);
    },
    dirname: function(filename) {
      var lastSlash = filename.lastIndexOf('/');
      if (lastSlash === -1)
        return '.';
      if (lastSlash === 0)
        return '/';
      return filename.slice(0, lastSlash);
    }
  }, {}, $__super);
}(Loader);
var BrowserTraceurLoader = function($__super) {
  function BrowserTraceurLoader() {
    $__superConstructor(BrowserTraceurLoader).call(this, webLoader, window.location.href, new LoaderCompiler());
  }
  return ($__createClass)(BrowserTraceurLoader, {loadScriptTypeModule: function() {
      var traceurOptions = arguments[0] !== (void 0) ? arguments[0] : new Options();
      new traceur.WebPageTranscoder(document.location.href, traceurOptions).run();
    }}, {}, $__super);
}(TraceurLoader);
