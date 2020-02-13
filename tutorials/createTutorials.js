#!/usr/bin/env node

var path = require('path')
  , fs = require('fs-extra');

var tutorialJson = require('./tutorials.json');

fs.emptyDirSync(path.join(__dirname, 'all'));

var tutorialDir = path.join(__dirname, '..', 'examples');
var tutorials = Object.keys(tutorialJson);

transferTutorials(tutorials, tutorialJson);

function transferTutorials(tutorials, tutorialJson) {
  return tutorials.reduce(function(sequence, tutorialName) {
    return sequence.then(function() {
      var tutorial = tutorialJson[tutorialName];
      var file = tutorial.file;
      var tutorialPath = path.join(tutorialDir, file);
      return new Promise(function(resolve, reject) {
        file = file.replace('/', '_');
        fs.copy(tutorialPath, path.join(__dirname, 'all', file), function() {
          var children = tutorial.children;
          if (children) {
            console.log('children',children);
            resolve(transferTutorials(Object.keys(children), children));
          } else {
            resolve();
          }
        });
      });
    });
  }, Promise.resolve());
}
