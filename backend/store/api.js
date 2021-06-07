var express = require('express');
var router = express.Router();
var ctrl = require('./handler');
const appmw = require('../services/appMiddleware')
// store
router.route('/')
    .get(ctrl.publicWorkbookList)

router.route('/:wbid')
    .get(ctrl.publicWorkbookDetails)  // to view public details of a  workbook
    .post(appmw.needAuthentication,ctrl.getWb)   // to get a workbook  in free or beta, {wbuser} , 
//  .put(appmw.needAuthentication,ctrl.subscribeOrRenewWb)  // to subscribe/renew a workbook  ==> moved to payment module 

// beta store    
router.route('/beta/list')
    .get(appmw.needAuthentication,ctrl.listBetaWorkbook)

router.route('/beta/:wbid/:pubid')
    .get(appmw.needAuthentication,ctrl.publicWorkbookDetailsBeta)

module.exports = router;