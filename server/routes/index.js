// Requires all the files containing routes for modularity

'use strict';

var router = function(app, passport) {

  require('./main.js').setup(app);
  require('./apartment.js').setup(app);
  require('./bills.js').setup(app);
  require('./chores.js')(app);
  require('./supplies.js').setup(app);
  require('./messages.js').setup(app);
  require('./comments.js')(app);
  require('./user.js').setup(app);
  require('./history.js').setup(app);
  require('./invitations.js').setup(app);
  require('./passport.js')(app, passport);

};

module.exports = router;
