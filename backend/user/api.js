var express = require('express');
var router = express.Router();
var ctrl = require('./handler');
const appmw = require('../services/appMiddleware')

router.post('/',ctrl.newUserSignUp);

router.get('/verify/:wbuser/:emailtoken',ctrl.verifyNewUser);

router.get('/image/:wbuser',ctrl.showImg);

router.post('/reset',ctrl.sendResetPwdEmail);
router.put('/reset',ctrl.resetPwd);

router.post('/login',ctrl.login);
router.post('/socialLogin',ctrl.socialLogin);

router.get('/u/:wbuser',appmw.secureAndPrivateForUser,ctrl.getUserDetails);
router.post('/u/:wbuser',appmw.secureAndPrivateForUser,ctrl.updateUserDetails);

router.get('/meta/:wbuser',appmw.secureAndPrivateForUser,ctrl.getUserMeta);
router.post('/meta/:wbuser',appmw.secureAndPrivateForUser,ctrl.updateUserMeta);

// appmw.secureAndPrivateForUser,
router.get('/u/:wbuser/details',appmw.secureAndPrivateForUser,ctrl.getAdditionalData);

module.exports = router;