const ghutils = require('ghutils/test-util')
    , ghrepos = require('./')
    , test    = require('tape')
    , xtend   = require('xtend')


test('test list repos for user', function (t) {
  t.plan(10)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , user     = 'testuser'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      ghrepos.listUser(xtend(auth), user, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/users/testuser/repos?'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})

test('test list repos for org', function (t) {
  t.plan(10)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      ghrepos.listOrg(xtend(auth), org, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/orgs/testorg/repos?'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})

test('test list repos for authed user', function (t) {
  t.plan(10)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      ghrepos.listUser(xtend(auth), ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/user/repos'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test list repos for authed user with multi-page', function (t) {
  t.plan(13)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , {
              response : [ { test5: 'data5' }, { test6: 'data6' } ]
            , headers  : { link: '<https://somenexturl2>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response.concat(testData[1].response)
      ghrepos.listUser(xtend(auth), ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/user/repos'
      , 'https://somenexturl'
      , 'https://somenexturl2'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test list repos for authed user with no repos', function (t) {
  t.plan(7)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , testData = [ [] ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      ghrepos.listUser(xtend(auth), ghutils.verifyData(t, []))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/user/repos'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get ref list for a repo', function (t) {
  t.plan(13)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , {
              response : [ { test5: 'data5' }, { test6: 'data6' } ]
            , headers  : { link: '<https://somenexturl2>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response.concat(testData[1].response)
      ghrepos.listRefs(xtend(auth), org, repo, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/git/refs'
      , 'https://somenexturl'
      , 'https://somenexturl2'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get branch list for a repo', function (t) {
  t.plan(13)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , {
              response : [ { test5: 'data5' }, { test6: 'data6' } ]
            , headers  : { link: '<https://somenexturl2>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response.concat(testData[1].response)
      ghrepos.listBranches(xtend(auth), org, repo, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/branches'
      , 'https://somenexturl'
      , 'https://somenexturl2'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get tag list for a repo', function (t) {
  t.plan(13)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , {
              response : [ { test5: 'data5' }, { test6: 'data6' } ]
            , headers  : { link: '<https://somenexturl2>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response.concat(testData[1].response)
      ghrepos.listTags(xtend(auth), org, repo, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/tags'
      , 'https://somenexturl'
      , 'https://somenexturl2'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get ref data for a ref', function (t) {
  t.plan(7)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , ref      = 'head/testref'
    , testData = [
          { test3: 'data3' }
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      ghrepos.getRef(xtend(auth), org, repo, ref, ghutils.verifyData(t, testData[0]))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/git/refs/' + ref
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get branch data for a branch', function (t) {
  t.plan(7)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , branch   = 'testbranch'
    , testData = [
          { test3: 'data3' }
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      ghrepos.getBranch(xtend(auth), org, repo, branch, ghutils.verifyData(t, testData[0]))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/branches/' + branch
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get ref data for a ref with refs/ prefix', function (t) {
  t.plan(7)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , ref      = 'head/testref'
    , testData = [
          { test3: 'data3' }
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      ghrepos.getRef(xtend(auth), org, repo, 'refs/' + ref, ghutils.verifyData(t, testData[0]))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/git/refs/' + ref
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test list commits for authed user', function (t) {
  t.plan(10)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , []
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      ghrepos.listCommits(xtend(auth), org, repo, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/testorg/testrepo/commits'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get commit for authed user', function (t) {
  t.plan(7)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , ref      = 'aaee1122'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      ghrepos.getCommit(xtend(auth), org, repo, ref, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/testorg/testrepo/commits/aaee1122'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test get commit comments for authed user', function (t) {
  t.plan(7)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , ref      = 'aaee1122'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
      ]
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      ghrepos.getCommitComments(xtend(auth), org, repo, ref, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/testorg/testrepo/commits/aaee1122/comments'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})


test('test footype repo lister', function (t) {
  t.plan(10)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , repo     = 'testrepo'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , []
      ]
    , lister   = ghrepos.createLister('footype')
    , server

  server = ghutils.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response
      lister(xtend(auth), org, repo, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
        'https://api.github.com/repos/' + org + '/' + repo + '/footype'
      , 'https://somenexturl'
    ]))
    .on('close'  , ghutils.verifyClose(t))
})
