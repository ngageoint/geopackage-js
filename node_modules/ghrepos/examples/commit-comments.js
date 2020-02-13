const ghauth      = require('ghauth')
    , ghrepos     = require('..')
    , authOptions = {
          configName : 'lister'
        , scopes     : [ 'user' ]
      }

ghauth(authOptions, function (err, authData) {
  ghrepos.getCommitComments(authData, 'nodejs', 'node', '75318e46b', function (err, comments) {
    if (err) throw err
    console.log(JSON.stringify(comments.map(function (i) {
      return { user: i.user.login, body: i.body }
    }), null, 2))
  })
})
