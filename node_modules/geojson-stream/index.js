var JSONStream = require('JSONStream');

var open = '{"type":"FeatureCollection","features":[',
    close = ']}';

module.exports.parse = function(mapFunc) {
    var indexFunc;
    if (mapFunc) {
        indexFunc = function(feature, context) {
            return mapFunc(feature, context[1]);
        }
    }
    var jsonstream = JSONStream.parse('features.*', indexFunc);
    return jsonstream;
};

module.exports.stringify = function() {
    var jsonstream = JSONStream.stringify(open, '\n,\n', close);
    return jsonstream;
};
