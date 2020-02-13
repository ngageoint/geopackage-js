const ghrepos = require('ghrepos')
const ghutils = require('ghutils')
const after = require('after')
const template = require('url-template')
const uniq = require('lodash.uniq')
const basename = require('path').basename
const fs = require('fs')
const getMime = require('simple-mime')('application/octet-stream')
const ghget = ghutils.ghget
const ghpost = ghutils.ghpost

function baseUrl (org, repo) {
  return ghrepos.baseUrl(org, repo) + '/releases'
}

function getLatest (auth, org, repo, options, callback) {
  getBase(auth, org, repo, 'latest', options, callback)
}

function getById (auth, org, repo, id, options, callback) {
  getBase(auth, org, repo, id, options, callback)
}

function getByTag (auth, org, repo, tag, options, callback) {
  getBase(auth, org, repo, 'tags/' + tag, options, callback)
}

function create (auth, org, repo, data, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  ghutils.ghpost(auth, baseUrl(org, repo), data, options, callback)
}

function uploadAssets (auth, org, repo, tail, files, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  if (typeof files === 'string') files = [ files ]

  files = uniq(files)

  getBase(auth, org, repo, tail, options, (err, release) => {
    if (err) return callback(err)

    if (typeof release.upload_url !== 'string') {
      return callback(new Error('invalid upload_url'))
    }

    const results = []
    const done = after(files.length, err => callback(err, results))
    const assetTemplate = template.parse(release.upload_url)

    files.forEach(path => {
      fs.stat(path, (err, stats) => {
        if (err || !stats) {
          return done(err || new Error('failed to get file stats'))
        }

        if (stats.isDirectory()) {
          return done(new Error('can only upload files'))
        }

        const opts = Object.assign({}, options, {
          headers: {
            'content-length': stats.size,
            'content-type': getMime(path)
          }
        })

        const uploadUrl = assetTemplate.expand({ name: basename(path) })
        ghpost(auth, uploadUrl, fs.createReadStream(path), opts, (err, result) => {
          if (!err) results.push(result)
          done(err)
        })
      })
    })
  })
}

function getBase (auth, org, repo, tail, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  const url = baseUrl(org, repo) + '/' + tail
  ghget(auth, url, options, callback)
}

module.exports.list = ghrepos.createLister('releases')
module.exports.getLatest = getLatest
module.exports.getById = getById
module.exports.getByTag = getByTag
module.exports.create = create
module.exports.uploadAssets = uploadAssets
