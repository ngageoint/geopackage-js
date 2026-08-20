// .mocharc.js
module.exports = {
    diff: true,
    extension: ['ts', 'tsx', 'js'], // include extensions
    require: ['ts-node/register/transpile-only'],
    file: ['./test/setupNodeEnv.js'],
    package: './package.json',
    reporter: 'spec',
    slow: 75,
    timeout: 2000,
    ui: 'bdd'
};