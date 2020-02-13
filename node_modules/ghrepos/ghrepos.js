const ghutils = require('ghutils')
    , apiRoot = ghutils.apiRoot


function listUser (auth, user, options, callback) {
  return list (auth, 'user', user, options, callback)
}


function listOrg (auth, org, options, callback) {
  return list (auth, 'org', org, options, callback)
}


function list (auth, type, org, options, callback) {
  if (typeof org == 'function') { // list for this user
    callback = org
    options = {}
    org = null
  } else if (typeof options == 'function') { // no options
    callback = options
    options  = {}
  }

  var urlbase = apiRoot

  if (org == null) {
    urlbase += '/user/repos'
  } else {
    if (type == 'org')
      urlbase += '/orgs/' + org + '/repos?'
    else
      urlbase += '/users/' + org + '/repos?'
  }

  ghutils.lister(auth, urlbase, options, callback)
}


;[ 'refs', 'tags', 'branches', 'commits' ].forEach(function (type) {
  var singular = type.replace(/e?s$/, '')

  var lister = function (auth, org, repo, options, callback) {
    if (typeof options == 'function') { // no options
      callback = options
      options  = {}
    }

    var url = refsBaseUrl(org, repo, type)
    ghutils.lister(auth, url, options, callback)
  }

  module.exports['list' + type[0].toUpperCase() + type.substring(1)] = lister

  if (type == 'tag')
    return

  // no getTag API
  var getter = function (auth, org, repo, ref, options, callback) {
    if (typeof options == 'function') {
      callback = options
      options  = {}
    }

    // a valid ref but we're not using this format
    ref = ref.replace(/^refs\//, '')

    var url = refsBaseUrl(org, repo, type) + '/' + ref
    ghutils.ghget(auth, url, options, callback)
  }

  module.exports['get' + singular[0].toUpperCase() + singular.substring(1)] = getter
})

function getCommitComments (auth, org, repo, sha1, options, callback) {
  var ref = sha1 + '/comments'
  return module.exports.getCommit(auth, org, repo, ref, options, callback)
}

function createLister (type) {
  return function list (auth, org, repo, options, callback) {
    if (typeof options == 'function') {
      callback = options
      options  = {}
    }

    var url = baseUrl(org, repo) + '/' + type
    ghutils.lister(auth, url, options, callback)
  }
}


function refsBaseUrl (org, repo, type) {
  if (type == 'refs')
    type = 'git/' + type
  return baseUrl(org, repo) + '/' + type
}


function baseUrl (org, repo) {
  return apiRoot + '/repos/' + org + '/' + repo
}


module.exports.listUser          = listUser
module.exports.listOrg           = listOrg
module.exports.baseUrl           = baseUrl
module.exports.getCommitComments = getCommitComments
module.exports.createLister      = createLister
