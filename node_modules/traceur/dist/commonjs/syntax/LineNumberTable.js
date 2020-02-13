"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  LineNumberTable: {
    enumerable: true,
    get: function() {
      return LineNumberTable;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var SourcePosition = require("../util/SourcePosition.js").SourcePosition;
var SourceRange = require("../util/SourceRange.js").SourceRange;
var isLineTerminator = require("./Scanner.js").isLineTerminator;
var MAX_INT_REPRESENTATION = 9007199254740992;
function computeLineStartOffsets(source) {
  var lineStartOffsets = [0];
  var k = 1;
  for (var index = 0; index < source.length; index++) {
    var code = source.charCodeAt(index);
    if (isLineTerminator(code)) {
      if (code === 13 && source.charCodeAt(index + 1) === 10) {
        index++;
      }
      lineStartOffsets[k++] = index + 1;
    }
  }
  lineStartOffsets[k++] = MAX_INT_REPRESENTATION;
  return lineStartOffsets;
}
var LineNumberTable = function() {
  function LineNumberTable(sourceFile) {
    this.sourceFile_ = sourceFile;
    this.lineStartOffsets_ = null;
    this.lastLine_ = 0;
    this.lastOffset_ = -1;
  }
  return ($__createClass)(LineNumberTable, {
    ensureLineStartOffsets_: function() {
      if (!this.lineStartOffsets_) {
        this.lineStartOffsets_ = computeLineStartOffsets(this.sourceFile_.contents);
      }
    },
    getSourcePosition: function(offset) {
      return new SourcePosition(this.sourceFile_, offset);
    },
    getLine: function(offset) {
      if (offset === this.lastOffset_)
        return this.lastLine_;
      this.ensureLineStartOffsets_();
      if (offset < 0)
        return 0;
      var line;
      if (offset < this.lastOffset_) {
        for (var i = this.lastLine_; i >= 0; i--) {
          if (this.lineStartOffsets_[i] <= offset) {
            line = i;
            break;
          }
        }
      } else {
        for (var i$__1 = this.lastLine_; true; i$__1++) {
          if (this.lineStartOffsets_[i$__1] > offset) {
            line = i$__1 - 1;
            break;
          }
        }
      }
      this.lastLine_ = line;
      this.lastOffset_ = offset;
      return line;
    },
    offsetOfLine: function(line) {
      this.ensureLineStartOffsets_();
      return this.lineStartOffsets_[line];
    },
    getColumn: function(offset) {
      var line = this.getLine(offset);
      return offset - this.lineStartOffsets_[line];
    },
    getSourceRange: function(startOffset, endOffset) {
      return new SourceRange(this.getSourcePosition(startOffset), this.getSourcePosition(endOffset));
    }
  }, {});
}();
