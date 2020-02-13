# ghreleases

> Interact with the GitHub releases API.

[![npm](https://img.shields.io/npm/v/ghreleases.svg)](https://www.npmjs.com/package/ghreleases)
![node](https://img.shields.io/node/v/ghreleases.svg)
[![travis](https://secure.travis-ci.org/ralphtheninja/ghreleases.png)](http://travis-ci.org/ralphtheninja/ghreleases)
[![david](https://david-dm.org/ralphtheninja/ghreleases.svg)](https://david-dm.org/ralphtheninja/ghreleases)
[![standard](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm](https://img.shields.io/npm/dm/ghreleases.svg)](https://www.npmjs.com/package/ghreleases)

## API

### `list(auth, org, repo[, options], cb)`

List all releases for a repo. Calls back with an array of releases.

```js
const gh = require('ghreleases')
const auth = {
  token: '90230948aef88723eca2309880fea09789234',
  user: 'ralphtheninja'
}
gh.list(auth, 'level', 'leveldown', (err, list) => {
  console.log(list)
})
```

GitHub [docs](https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository).

### `getLatest(auth, org, repo[, options], cb)`

Get latest release.

```js
gh.getLatest(auth, 'level', 'leveldown', (err, release) => {
  console.log(release)
})
```

GitHub [docs](https://developer.github.com/v3/repos/releases/#get-the-latest-release).

### `getById(auth, org, repo, id[, options], cb)`

Get data for a single release.

```js
gh.getById(auth, 'level', 'leveldown', '1363866', (err, release) => {
  console.log(release)
})
```

GitHub [docs](https://developer.github.com/v3/repos/releases/#get-a-single-release).

### `getByTag(auth, org, repo, tag[, options], cb)`

Get release by tag.

```js
gh.getByTag(auth, 'level', 'leveldown', 'v1.2.2', (err, release) => {
  console.log(release)
})
```

GitHub [docs](https://developer.github.com/v3/repos/releases/#get-a-release-by-tag-name).

### `create(auth, org, repo, data[, options], cb)`

Create a release.

```js
const data = {
  tag_name: '1.2.3-test',
  name: 'Release name for 1.2.3-test',
  body: 'Body text of release goes here'
}
gh.create(auth, 'level', 'leveldown', data, (err, release) => {
  console.log(release)
})
```

The release on GitHub would then look as follows:

![1.2.3-test release](images/github-release.png?raw=true "1.2.3-test release")

GitHub [docs](https://developer.github.com/v3/repos/releases/#create-a-release)

### `uploadAssets(auth, org, repo, release, files[, options], cb)`

Upload assets to a release. Calls back with an array of results for each upload request.

* The `release` parameter accepts either a release `id`, `'latest'` or a valid ref, e.g. `'tags/v1.0.0'`
* The `files` parameter is an array of absolute file paths that should be uploaded and associated with this release

```js
const ref = 'tags/v1.3.0'
const files = [
  '/path/to/README.md',
  '/path/to/prebuilt/binary.tar.gz'
]
gh.uploadAssets(auth, 'level', 'leveldown', ref, files, (err, res) => {
  console.log(res)
})
```

GitHub [docs](https://developer.github.com/v3/repos/releases/#upload-a-release-asset)

## Also See

For interacting with other parts of the GitHub API, check out the modules below.

* [`ghissues`](https://github.com/rvagg/ghissues)
* [`ghusers`](https://github.com/rvagg/ghusers)
* [`ghteams`](https://github.com/rvagg/ghteams)
* [`ghrepos`](https://github.com/rvagg/ghrepos)
* [`ghpulls`](https://github.com/rvagg/ghpulls)
* [`ghauth`](https://github.com/rvagg/ghauth)
* [`ghutils`](https://github.com/rvagg/ghutils)

## License

MIT
