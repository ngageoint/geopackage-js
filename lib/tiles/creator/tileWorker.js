const ProjectTile = require('./projectTile');

function tileWorker(e) {
  const self = this;
  const job = e.data;

  ProjectTile(job, function(err, data) {
    // @ts-ignore
    postMessage(data);
    self.close();
  });
}

module.exports = function(self) {
  self.onmessage = tileWorker;
  self.onerror = function(e) {
    console.log('error', e);
  };
};
