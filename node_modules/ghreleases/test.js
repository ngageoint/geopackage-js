const ghutils = require('ghutils/test-util')
const ghreleases = require('./')
const test = require('tape')
const xtend = require('xtend')

test('test list releases for org/repo with multi-page', t => {
  t.plan(13)

  const auth = { user: 'authuser', token: 'authtoken' }
  const org = 'testorg'
  const repo = 'testrepo'
  const testData = [
    {
      response: [ { test3: 'data3' }, { test4: 'data4' } ],
      headers: { link: '<https://somenexturl>; rel="next"' }
    },
    {
      response: [ { test5: 'data5' }, { test6: 'data6' } ],
      headers: { link: '<https://somenexturl2>; rel="next"' }
    },
    []
  ]

  ghutils.makeServer(testData)
    .on('ready', () => {
      var result = testData[0].response.concat(testData[1].response)
      ghreleases.list(xtend(auth), org, repo, ghutils.verifyData(t, result))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
      'https://api.github.com/repos/' + org + '/' + repo + '/releases',
      'https://somenexturl',
      'https://somenexturl2'
    ]))
    .on('close', ghutils.verifyClose(t))
})

test('get latest release', t => {
  t.plan(7)

  const auth = { user: 'authuser', token: 'authtoken' }
  const org = 'testorg'
  const repo = 'testrepo'
  const testData = { test: 'data' }

  ghutils.makeServer(testData)
    .on('ready', () => {
      ghreleases.getLatest(xtend(auth), org, repo, ghutils.verifyData(t, testData))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
      'https://api.github.com/repos/' + org + '/' + repo + '/releases/latest'
    ]))
    .on('close', ghutils.verifyClose(t))
})

test('get release by id', t => {
  t.plan(7)

  const auth = { user: 'authuser', token: 'authtoken' }
  const org = 'testorg'
  const repo = 'testrepo'
  const testData = { test: 'data' }
  const id = 314

  ghutils.makeServer(testData)
    .on('ready', () => {
      ghreleases.getById(xtend(auth), org, repo, id, ghutils.verifyData(t, testData))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
      'https://api.github.com/repos/' + org + '/' + repo + '/releases/' + id
    ]))
    .on('close', ghutils.verifyClose(t))
})

test('get release by tag', t => {
  t.plan(7)

  const auth = { user: 'authuser', token: 'authtoken' }
  const org = 'testorg'
  const repo = 'testrepo'
  const testData = { test: 'data' }
  const tag = 'v1.0.0'

  ghutils.makeServer(testData)
    .on('ready', () => {
      ghreleases.getByTag(xtend(auth), org, repo, tag, ghutils.verifyData(t, testData))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
      'https://api.github.com/repos/' + org + '/' + repo + '/releases/tags/' + tag
    ]))
    .on('close', ghutils.verifyClose(t))
})

test('create release', t => {
  t.plan(8)

  const auth = { user: 'authuser', token: 'authtoken' }
  const org = 'testorg'
  const repo = 'testrepo'
  const testData = {
    tag_name: '1.2.3-test',
    name: 'Release name for 1.2.3-test',
    body: 'Body text of release goes here'
  }

  ghutils.makeServer(testData)
    .on('ready', () => {
      ghreleases.create(xtend(auth), org, repo, testData, ghutils.verifyData(t, testData))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('post', ghutils.verifyUrl(t, [
      'https://api.github.com/repos/' + org + '/' + repo + '/releases'
    ]))
    .on('post', (url, data) => {
      t.deepEqual(data, testData)
    })
    .on('close', ghutils.verifyClose(t))
})

test('uploading assets', t => {
  t.plan(16)

  const auth = { user: 'authuser', token: 'authtoken' }
  const org = 'testorg'
  const repo = 'testrepo'
  const testData = [
    { upload_url: 'https://upload_url/path{?name}' },
    { test5: 'data5' },
    { test6: 'data6' }
  ]
  const ref = 'tags/v1.3.0'
  const files = [ 'test.js', 'README.md', 'test.js' ]
  var postCount = 0

  ghutils.makeServer(testData)
    .on('ready', () => {
      ghreleases.uploadAssets(xtend(auth), org, repo, ref, files, ghutils.verifyData(t, [ testData[1], testData[2] ]))
    })
    .on('request', ghutils.verifyRequest(t, auth))
    .on('get', ghutils.verifyUrl(t, [
      'https://api.github.com/repos/' + org + '/' + repo + '/releases/' + ref
    ]))
    .on('post', (url, data, options) => {
      t.equal(url, 'https://upload_url/path?name=' + files[postCount++])
      t.equal(typeof data.pipe, 'function', 'should be a stream')
    })
    .on('close', () => {
      t.is(postCount, 2, 'only two files')
      ghutils.verifyClose(t)()
    })
})
