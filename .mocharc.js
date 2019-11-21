// .mocharc.js
module.exports = {
    diff: true,
    extension: ['ts', 'tsx', 'js'], // include extensions
    opts: './mocha.opts', // point to you mocha options file. the rest is whatever.
    package: './package.json',
    reporter: 'spec',
    slow: 75,
    timeout: 2000,
    ui: 'bdd'
};