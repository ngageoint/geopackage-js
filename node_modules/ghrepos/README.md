# ghrepos

[![Build Status](https://secure.travis-ci.org/rvagg/ghrepos.png)](http://travis-ci.org/rvagg/ghrepos)

**A node library to interact with the GitHub repos API**

[![NPM](https://nodei.co/npm/ghrepos.png?mini=true)](https://nodei.co/npm/ghrepos/)

See also:

* https://github.com/rvagg/ghissues
* https://github.com/rvagg/ghusers
* https://github.com/rvagg/ghteams
* https://github.com/rvagg/ghauth

## API

### listUser(auth[, user][, options], callback)

List all repos for a user. If `user` and `options` are omitted the current user is assumed.

List all repos for user `'rvagg'`:

```js
const ghrepos     = require('ghrepos')
    , authOptions = { user: 'rvagg', token: '24d5dee258c64aef38a66c0c5eca459c379901c2' }

ghrepos.listUser(authOptions, 'rvagg', function (err, repolist) {
  console.log(reposlist)
})
```

### listOrg(auth, org[, options], callback)

List all repos for a organisation. If `org` and `options` are omitted the current org is assumed.

List all repos for org `'nodejs'`:

```js
const ghrepos     = require('ghrepos')
    , authOptions = { user: 'rvagg', token: '24d5dee258c64aef38a66c0c5eca459c379901c2' }

ghrepos.listOrg(authOptions, 'nodejs', function (err, repolist) {
  console.log(reposlist)
})
```

### listRefs(auth, org, repo[, options], callback)

Get git ref data for all refs in a repo.

Get all ref data for `nodejs/node` repo:

```js
ghrepos.listRefs(authOptions, 'nodejs', 'node', function (err, refData) {
  // data containing ref information including sha and github url
  console.log(refData)
})
```

### listBranches(auth, org, repo[, options], callback)

List git branches for a repo.

Get all branches for `nodejs/node` repo:

```js
ghrepos.listBranches(authOptions, 'nodejs', 'node', function (err, refData) {
  // data containing branch information including sha and github API url
  console.log(refData)
})
```

### listCommits(auth, org, repo[, options], callback)

List git commits for a repo.

Get all commits for `nodejs/node` repo:

```js
ghrepos.listCommits(authOptions, 'nodejs', 'node', function (err, refData) {
  // data containing commit information including sha and github API url
  console.log(refData)
})
```

### listTags(auth, org, repo[, options], callback)

List git tags for a repo.

Get all tag for `nodejs/node` repo:

```js
ghrepos.listTags(authOptions, 'nodejs', 'node', function (err, refData) {
  // data containing tag information including sha and github API url
  console.log(refData)
})
```

### getRef(auth, org, repo, ref[, options], callback)

Get git ref data for a particular ref string.

Get git ref data for `v1.x` branch in `nodejs/node` repo:

```js
ghrepos.getRef(authOptions, 'nodejs', 'node', 'heads/v1.x', function (err, refData) {
  // data containing ref information including sha and github url
  console.log(refData)
})
```

### getBranch(auth, org, repo, branch[, options], callback)

Get git branch data for a given branch name

Get git branch data for `v1.x` branch in `nodejs/node` repo:

```js
ghrepos.getBranch(authOptions, 'nodejs', 'node', 'v1.x', function (err, refData) {
  // data containing branch information including sha and github API url
  console.log(refData)
})
```

### getCommit(auth, org, repo, sha1[, options], callback)

Get git commit data for a given sha1

Get git commit data for sha1 `75318e46b` in `nodejs/node` repo:

```js
ghrepos.getCommit(authOptions, 'nodejs', 'node', '75318e46b', function (err, refData) {
  // data containing commit information including sha and github API url
  console.log(refData)
})
```

### getCommitComments(auth, org, repo, sha1[, options], callback)

Get git commit comments data for a given sha1

Get git commit comments data for sha1 `75318e46b` in `nodejs/node` repo:

```js
ghrepos.getCommitComments(authOptions, 'nodejs', 'node', '75318e46b', function (err, comments) {
  // array containing commit comments information
  console.log(JSON.stringify(comments.map(function (i) {
    return { user: i.user.login, body: i.body }
  }), null, 2))
})
```

Yields:

```json
[
  {
    "user": "Trott",
    "body": "@cjihrig There's no PR-URL on this commit message. (`core-validate-commit` FTW as usual!)"
  },
  {
    "user": "mscdex",
    "body": "PR-URL is: https://github.com/nodejs/node/pull/15745"
  }
]
```

### createLister(type)

Creates a function that lists different sub types related to the `'/repos'` api, e.g. list `'issues'`, `'pulls'` or `'releases'`. The function returned has the signature: `function list (auth, org, repo, options, callback)`.

_More methods coming .. as I need them or as you PR them in._


The auth data is compatible with [ghauth](https://github.com/rvagg/ghauth) so you can just connect them together to make a simple command-line application:

```js
const ghauth     = require('ghauth')
    , ghrepos    = require('ghrepos')
    , authOptions = {
          configName : 'lister'
        , scopes     : [ 'user' ]
      }

ghauth(authOptions, function (err, authData) {
  ghrepos.listUser(authData, 'rvagg', function (err, list) {
    console.log('Repos for rvagg:')
    console.log(util.inspect(list.map(function (i) { return {
        name: i.name
      , desc: i.description
      , fork: i.fork
    }})))
  })
})
```


## License

**ghrepos** is Copyright (c) 2015 Rod Vagg [@rvagg](https://github.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.
