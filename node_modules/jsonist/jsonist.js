const url = require('url')
const hyperquest = require('hyperquest')
const bl = require('bl')
const stringify = require('json-stringify-safe')

function HttpError (message) {
  SyntaxError.call(this, message)
  Error.captureStackTrace(this, arguments.callee)
}

HttpError.prototype = Object.create(SyntaxError.prototype)
HttpError.prototype.constructor = HttpError

function collector (uri, options, callback) {
  var request = makeRequest(uri, options)
  var redirect = null
  var redirectCount = 0

  return handle(request)

  function handle (request) {
    if (options.followRedirects) {
      request.on('response', (response) => {
        redirect = isRedirect(request.request, response) && response.headers.location
      })
    }

    request.pipe(bl((err, data) => {
      if (redirect) {
        if (++redirectCount >= (typeof options.followRedirects === 'number' ? options.followRedirects : 10)) {
          return callback(new Error('Response was redirected too many times (' + redirectCount + ')'))
        }
        request = makeRequest(url.resolve(uri, redirect), options)
        redirect = null
        return handle(request)
      }

      if (err) {
        return callback(err)
      }

      if (!data.length) {
        return callback(null, null, request.response)
      }

      var ret, msg

      try {
        ret = JSON.parse(data.toString())
      } catch (e) {
        msg = 'JSON parse error: ' + e.message
        err = request.response.statusCode >= 300 ? new HttpError(msg) : new SyntaxError(msg)

        err.statusCode = request.response.statusCode
        err.data = data
        err.response = request.response

        return callback(err)
      }

      callback(null, ret, request.response)
    }))

    return request
  }
}

function makeMethod (method, data) {
  function handler (uri, options, callback) {
    var defaultOptions = { method, headers: {} }
    if (typeof options === 'object') {
      options = Object.assign(defaultOptions, options)
    } else {
      callback = options
      options = defaultOptions
    }

    if (data && typeof options.headers['content-type'] !== 'string') {
      options.headers['content-type'] = 'application/json'
    }
    if (typeof options.headers['accept'] !== 'string') {
      options.headers['accept'] = 'application/json'
    }

    return collector(uri, options, callback)
  }

  function dataHandler (uri, data, options, callback) {
    var request = handler(uri, options, callback)

    if (typeof data.pipe === 'function') {
      data.pipe(request)
    } else {
      request.end(stringify(data))
    }

    return request
  }

  return data ? dataHandler : handler
}

function makeRequest (uri, options) {
  return (options.hyperquest || hyperquest)(uri, options)
}

function isRedirect (request, response) {
  return request.method === 'GET' &&
    response.headers.location &&
    (response.statusCode === 301 ||
      response.statusCode === 302 ||
      response.statusCode === 307 ||
      response.statusCode === 308
    )
}

module.exports.get = makeMethod('GET', false)
module.exports.post = makeMethod('POST', true)
module.exports.put = makeMethod('PUT', true)
module.exports.delete = function deleteHandler (uri, options, callback) {
  // behaves half-way between a data posting request and a GET
  // since https://github.com/substack/hyperquest/commit/9b130e101
  return makeMethod('DELETE', false)(uri, options, callback).end()
}
module.exports.HttpError = HttpError
