const ProjectTile = require('./projectTile');

function tileWorker(e) {
<<<<<<< HEAD
  console.log('Tile Worker - working');
  console.time('Tile Worker - time');
=======
>>>>>>> develop
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
