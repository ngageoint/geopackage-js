// .mocharc.js
module.exports = {
    diff: true,
    extension: ['js', 'ts', 'tsx'], // include extensions
    package: './package.json',
    reporter: 'spec',
    slow: 75,
    timeout: 2000,
    ui: 'bdd',
    file: ['./test/setupNodeEnv.js'],
    require:  ['ts-node/register', 'chai', 'test/testUtils', 'source-map-support/register'],
    recursive: true,
    fullTrace: true,
};