// Karma configuration
// Generated on Thu Jan 28 2016 08:02:07 GMT-0700 (MST)
//
//
var istanbul = require('browserify-istanbul');

module.exports = function(config) {
  config.set({

    plugins: [
      "babel-plugin-transform-es2015-arrow-functions",
      "karma-spec-reporter",
      "karma-coverage",
      "karma-mocha",
      "karma-chai",
      "karma-chrome-launcher",
      "karma-phantomjs-launcher",
      "karma-browserify"
    ],

    basePath: '',
    frameworks: ['mocha', 'chai', 'browserify'],

    files: [
      'test/test.js',
      'test/index.html'
    ],

    proxies: {
      '/node_modules/':'node_modules/'
    },

    browserify: {
      watch: true,
      debug: true,
      transform: [["babelify", { "presets": ["env", "es2015"], "plugins": ["transform-es2015-arrow-functions"] }]]
    },

    preprocessors: {
      'node_modules/file-type/index.js': ['browserify'],
      'test/test.js': ['browserify']
    },

    reporters: ['spec', 'coverage'],

    coverageReporter: {
      // specify a common output directory
      dir: 'coverage/browser-coverage',
      includeAllSources: true,
      reporters: [
        // reporters not supporting the `file` property
        { type: 'html', subdir: 'html' }
      ]
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_DEBUG,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true,
    concurrency: Infinity
  });
};
