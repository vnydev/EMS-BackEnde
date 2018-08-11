var express = require('express');
var router = express.Router();
var customSchema = require('../db/custom_scheme');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// customSchema.saveAll_country();
module.exports = router;
