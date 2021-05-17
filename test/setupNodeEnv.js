var Context = require('../lib/context/context').Context;
before(async () => {
  Context.setupNodeContext();
  await Context.initializeContext();
});
