var express = require('express');
var router  = express.Router();

var userService = require('../server/userService');

/* GET webhook auth. */
router.get('/', function(req, res) {
  res.send(userService.getData())
});

module.exports = router;
