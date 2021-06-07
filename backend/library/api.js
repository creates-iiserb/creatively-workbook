var express = require('express');
var router = express.Router();
var ctrl = require('./handler');
const appmw = require('../services/appMiddleware')

router.get('/', appmw.needAuthentication, ctrl.listofSubscribedWb)

router.route('/:wbid')
    .get(appmw.needAuthentication, ctrl.detailsofSubscribedWb)

router.route('/meta')
    .post(ctrl.wbmetadata)

router.route('/update/wb/:wbid')
    .post(appmw.needAuthentication, ctrl.updateSubscription)

router.route('/:subid/:wsid')
    .post(appmw.needAuthentication, ctrl.loadWorksheet)
    .put(appmw.needAuthentication, ctrl.submitAWorksheet)
    .patch(appmw.needAuthentication, ctrl.saveResponse)
    .delete(appmw.needAuthentication, ctrl.resetWorksheet) // not in use

router.route('/:subid/:wsid/checkans')
    .post(appmw.needAuthentication, ctrl.checkAnsLesson)

router.route('/reset/:subid/:wsid')
    .post(appmw.needAuthentication, ctrl.resetWorksheet)

router.route('/subGrade/:subId/:wsId/:refId')
    .post(appmw.needAuthentication, ctrl.subGrade)
// router.route('/:subid/:wsid/:queRef')    
//     .post(ctrl.checkQuestion)

module.exports = router;