const ProjectTile = require('./projectTile');

function tileWorker(e) {
  const self = this;
  const job = e.data;
  const data = ProjectTile(job);
  // @ts-ignore
  self.postMessage(data);
  self.close();
}

module.exports = function(self) {
  self.onmessage = tileWorker;
  self.onerror = function(e) {
    console.log('error', e);
  };
};
