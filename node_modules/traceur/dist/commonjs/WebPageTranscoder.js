"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  scriptSelector: {
    enumerable: true,
    get: function() {
      return scriptSelector;
    }
  },
  WebPageTranscoder: {
    enumerable: true,
    get: function() {
      return WebPageTranscoder;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ErrorReporter = require("./util/ErrorReporter.js").ErrorReporter;
var CommandOptions = require("./Options.js").CommandOptions;
var webLoader = require("./loader/webLoader.js").webLoader;
var scriptSelector = 'script[type="module"],script[type="text/traceur"]';
var WebPageTranscoder = function() {
  function WebPageTranscoder() {
    var url = arguments[0] !== (void 0) ? arguments[0] : document.location.href;
    var traceurOptions = arguments[1] !== (void 0) ? arguments[1] : new Options();
    this.url = url;
    this.numPending_ = 0;
    this.numberInlined_ = 0;
    this.traceurOptions_ = traceurOptions;
  }
  return ($__createClass)(WebPageTranscoder, {
    asyncLoad_: function(url, fncOfContent, onScriptsReady) {
      var $__3 = this;
      this.numPending_++;
      webLoader.load(url, function(content) {
        if (content)
          fncOfContent(content);
        else
          console.warn('Failed to load', url);
        if (--$__3.numPending_ <= 0)
          onScriptsReady();
      }, function(error) {
        console.error('WebPageTranscoder FAILED to load ' + url, error.stack || error);
      });
    },
    addFileFromScriptElement: function(scriptElement, name, content) {
      var options = this.traceurOptions_;
      var elementOptionString = scriptElement.getAttribute('traceurOptions');
      if (elementOptionString) {
        options = CommandOptions.fromString(elementOptionString);
      }
      var nameInfo = {
        address: name,
        referrerName: window.location.href,
        name: name,
        metadata: {traceurOptions: options}
      };
      var loadingResult;
      if (scriptElement.type === 'module')
        loadingResult = System.module(content, nameInfo);
      else
        loadingResult = System.script(content, nameInfo);
      loadingResult.catch(function(error) {
        console.error(error.stack || error);
      });
    },
    nextInlineScriptName_: function() {
      this.numberInlined_ += 1;
      if (!this.inlineScriptNameBase_) {
        var segments = this.url.split('.');
        segments.pop();
        this.inlineScriptNameBase_ = segments.join('.');
      }
      return this.inlineScriptNameBase_ + '_inline_script_' + this.numberInlined_ + '.js';
    },
    addFilesFromScriptElements: function(scriptElements, onScriptsReady) {
      for (var i = 0,
          length = scriptElements.length; i < length; i++) {
        var scriptElement = scriptElements[i];
        if (!scriptElement.src) {
          var name = this.nextInlineScriptName_();
          var content = scriptElement.textContent;
          this.addFileFromScriptElement(scriptElement, name, content);
        } else {
          var name$__4 = scriptElement.src;
          this.asyncLoad_(name$__4, this.addFileFromScriptElement.bind(this, scriptElement, name$__4), onScriptsReady);
        }
      }
      if (this.numPending_ <= 0)
        onScriptsReady();
    },
    get reporter() {
      if (!this.reporter_) {
        this.reporter_ = new ErrorReporter();
      }
      return this.reporter_;
    },
    putFile: function(file) {
      var scriptElement = document.createElement('script');
      scriptElement.setAttribute('data-traceur-src-url', file.name);
      scriptElement.textContent = file.generatedSource;
      var parent = file.scriptElement.parentNode;
      parent.insertBefore(scriptElement, file.scriptElement || null);
    },
    selectAndProcessScripts: function(done) {
      var selector = scriptSelector;
      var scripts = document.querySelectorAll(selector);
      if (!scripts.length) {
        done();
        return;
      }
      this.addFilesFromScriptElements(scripts, function() {
        done();
      });
    },
    run: function() {
      var done = arguments[0] !== (void 0) ? arguments[0] : function() {};
      var $__3 = this;
      var ready = document.readyState;
      if (ready === 'complete' || ready === 'loaded') {
        this.selectAndProcessScripts(done);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          return $__3.selectAndProcessScripts(done);
        }, false);
      }
    }
  }, {});
}();
