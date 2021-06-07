var express = require('express');
var router = express.Router();
var ctrl = require('./handler');
const appmw = require('../services/appMiddleware')

router.route('/:subid/:docId/:ref')
    .get(appmw.needAuthentication, ctrl.loadForum)
    .post(appmw.needAuthentication, ctrl.newEntry)
    .put(appmw.needAuthentication, ctrl.editMetaData)
    .delete(appmw.needAuthentication, ctrl.deleteEntry)

module.exports = router;
