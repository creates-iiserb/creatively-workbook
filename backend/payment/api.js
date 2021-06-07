var express = require('express');
var router = express.Router();
var ctrl = require('./handler');

router.route('/:subID/:wbuser/:authtoken')
    .get(ctrl.loadPaymentPage)
   // .post(ctrl.processSubscriptionType)

router.route('/redirectToPGateway')
    .post(ctrl.paymentGateway)

// payment gateway rediret url
router.route('/paymentstatus/:gateway/callback/:txnId')
    .post(ctrl.paymentStatus)
   //  .post(ctrl.paymentGateway)

module.exports = router;