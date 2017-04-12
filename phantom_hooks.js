
module.exports = {
  afterEnd: function(runner) {
    var fs = require('fs');

    var coverage = runner.page.evaluate(function() {
      return window.__coverage__;
    });

    if (coverage) {
      console.log('Writing coverage to coverage/browser/coverage.json');
      // fs.mkdir(path.join('.', 'coverage'), function(err) {
      //   console.log('arguments', arguments);
      //   console.log('made coverage directory');
      //   fs.mkdirSync('./coverage/browser');
        fs.write('./coverage/browser/coverage.json', JSON.stringify(coverage), 'w', function(err) {
          console.log('arguments', arguments);
        });
      // });
    } else {
      console.log('No coverage data generated');
    }
  }
};
