// Karma configuration
// Generated on Thu Jan 28 2016 08:02:07 GMT-0700 (MST)
//
//
var istanbul = require('browserify-istanbul');

module.exports = function(config) {
  config.set({

    plugins: [
      'karma-coverage',
      'karma-mocha',
      'karma-chai',
      'karma-phantomjs-launcher',
      'karma-browserify',
      'karma-spec-reporter',
      'karma-ng-html2js-preprocessor'
    ],

    basePath: '',
    frameworks: ['mocha', 'chai', 'browserify'],

    files: [
      'test/test.js',
      'test/**/*.js',
      '**/*.html'
    ],

    proxies: {
      '/node_modules/':'node_modules/'
    },

    exclude: ['node_modules'],

    browserify: {
      watch: true,
      debug: true,
      transform: [istanbul({
        ignore: [ 'test/**/*', '**/vendor/**/*']
      })]
    },

    preprocessors: {
      'app/**/*.js': ['coverage'],
      'test/**/*.js': ['browserify'],
      '**/*.html': ['ng-html2js']
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

    ngHtml2JsPreprocessor: {
      stripPrefix: 'public/',
      moduleName: 'ngTemplates'
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity
  });
};
