
var app = require('./express.js')
  , config = require('./config.js');

// Launches the Node.js Express Server
app.listen(config.port, config.address, function() {
  console.info('Mapbox Tools Server: Started listening at address %s on port %s', config.address, config.port);
});
