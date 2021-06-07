var express = require('express');
var router = express.Router();
var ctrl = require('./handler');

router.route('/transaction')
    .post(ctrl.fakeTransact)

module.exports = router;