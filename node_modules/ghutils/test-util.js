const http           = require('http')
    , EE             = require('events').EventEmitter
    , xtend          = require('xtend')
    , jsonist        = require('jsonist')
    , _jsonistget    = jsonist.get
    , _jsonistpost   = jsonist.post


function makeServer (data) {
  var ee     = new EE()
    , i      = 0
    , server = http.createServer(function (req, res) {
        ee.emit('request', req)

        var _data = Array.isArray(data) ? data[i++] : data

        if (_data && _data.headers && _data.headers.link)
          res.setHeader('link', _data.headers.link)

        res.end(JSON.stringify(_data && _data.response || _data))

        if (!Array.isArray(data) || i == data.length)
          server.close()
      })
      .listen(0, function (err) {
        if (err)
          return ee.emit('error', err)

        jsonist.get = function (url, opts, callback) {
          ee.emit('get', url, opts)
          return _jsonistget('http://localhost:' + server.address().port, opts, callback)
        }

        jsonist.post = function (url, data,  opts, callback) {
          ee.emit('post', url, data, opts)
          return _jsonistpost('http://localhost:' + server.address().port, data, opts, callback)
        }

        ee.emit('ready')
      })
      .on('close', ee.emit.bind(ee, 'close'))

  return ee
}


function toAuth (auth) {
  return 'Basic ' + (new Buffer(auth.user + ':' + auth.token).toString('base64'))
}


function verifyRequest (t, auth) {
  return function (req) {
    t.ok(true, 'got request')
    t.equal(req.headers['authorization'], toAuth(auth), 'got auth header')
  }
}


function verifyUrl (t, urls) {
  var i = 0
  return function (_url) {
    if (i == urls.length)
      return t.fail('too many urls/requests')
    t.equal(_url, urls[i++], 'correct url')
  }
}


function verifyClose (t) {
  return function () {
    t.ok(true, 'got close')
  }
}


function verifyData (t, data) {
  return function (err, _data) {
    t.notOk(err, 'no error')
    t.ok((data === '' && _data === '') || _data, 'got data')
    t.deepEqual(_data, data, 'got expected data')
  }
}


module.exports.makeServer    = makeServer
module.exports.toAuth        = toAuth
module.exports.verifyRequest = verifyRequest
module.exports.verifyUrl     = verifyUrl
module.exports.verifyClose   = verifyClose
module.exports.verifyData    = verifyData
