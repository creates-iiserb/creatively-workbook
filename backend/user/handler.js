// const config = require('../services/config');
const nano = require('nano')({ url: config.getEnv('dbServer') });
const usDb = nano.db.use('wbusers');
const utils = require('../services/utilities')
// const bcrypt = require('bcrypt');

var bcrypt1 = require('bcryptjs');


const rn = require('random-number');
const { getCode, getName } = require('country-list');

const wbDetails = require('../services/wbDetails');
// var passwordValidator = require('password-validator');
// // var passwordNotAllowed = config.get(passwordNotAllowed);

let newUserSignUp = async (req, res, next) => {
  try {
    let rqUser = req.body;
    await utils.inspectJSON(rqUser, {
      requiredFields: ['wbuser', 'password', 'country', 'name'],
      validFields: ['wbuser', 'password', 'country', 'name'],
      acceptBlank: false
    })
    let userEmailDetails = {}
    let countryCode = getCode(rqUser.country);
    await userAvailable(rqUser.wbuser)
    // if (await config.get('unameNotAllowed').indexOf(rqUser.wbuser) == -1) {
      // generate new user document
      let newUser = {
        _id: await utils.getNewUserId(),
        createdOn: new Date(),
        status: 0,
        image: await config.get('defaultUserImageBase64'),
        emailTokenSetDate: new Date(),
        name: rqUser.name,
        country: countryCode,
        wbuser: rqUser.wbuser,
        regType: 'email'
      }
      // hash password
      newUser['password'] = await hashPassword(rqUser.password);
      newUser['emailToken'] = await generateEmailToken();
      userEmailDetails = {
        wbuser: rqUser.wbuser,
        name: rqUser.name,
        emailToken: newUser['emailToken']
      }
      await usDb.insert(newUser);
      // send email to user
      let emailLink = await config.getInner('frontEndUrl', 'activateAccount') + userEmailDetails.wbuser + '/' + userEmailDetails.emailToken;
      let emailData = await utils.composeEmail('activateAccount', { name: userEmailDetails.name, link: emailLink })
      let emailRequest = {
        to: userEmailDetails.wbuser,
        sub: emailData.subject,
        body: emailData.body
      }
      await utils.requestToQuizServer('send_mail', emailRequest)
      res.success({ message: 'Account created successfully. Email verification pending. Check email' })
    // } else {
    //   throw utils.generateError('notAllowed', 'Username invalid');
    // }
  } catch (error) {
    res.error(error)
  }
}
module.exports.newUserSignUp = newUserSignUp;

let userDetailObject = async (wbuser) => {
  try {
    let wserdb = await usDb.view('web', 'emailToDoc', { key: wbuser });
    if (wserdb.rows.length > 0) {
      return wserdb.rows[0]['value']
    } else {
      throw utils.generateError('recordNotExists', 'User does not exists')
    }
  } catch (error) {
    throw error
  }

}

let verifyNewUser = async (req, res, next) => {
  try {
    let rqwbuser = req.params.wbuser;
    let rqemailtoken = req.params.emailtoken;
    let data = await userDetailObject(rqwbuser);
    // only users with status = 0 are allowed to verify account. status = 0 means account is inactive
    if (data.status == 0) {
      if (data.emailToken == rqemailtoken) {
        data.status = 1;
        // why generate a new email token ?  - so that a single token is used for verification only once. 
        data.emailToken = await generateEmailToken();
        await usDb.insert(data);
        res.success({ message: "Email verified. Account activated" })
      } else {
        throw utils.generateError('tokenInvalid', 'Email token is not valid');
      }
    } else {
      throw utils.generateError('alreadyActive', 'Email already verified');
    }
  } catch (err) {
    console.log(err)
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }
}
module.exports.verifyNewUser = verifyNewUser;

let sendResetPwdEmail = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      requiredFields: ['wbuser'],
      validFields: ['wbuser'],
      acceptBlank: false
    })

    let emailBodyData = {};
    let rqwbuser = req.body.wbuser;
    let doc = await userDetailObject(rqwbuser);
    await checkIfUserIsActive(doc)
    let data = doc // doc.rows[0].value;
    if (data.status == 1) {
      if (data.regType == "email") {
        data.emailToken = await generateEmailToken();
        data.emailTokenSetDate = new Date();
        emailBodyData['link'] = await config.getInner('frontEndUrl', 'resetPwd') + rqwbuser + '/' + data.emailToken;
        emailBodyData['name'] = data.name;
        await usDb.insert(data);
        let emailBody = await utils.composeEmail('resetPwd', emailBodyData)
        let emailRequest = {
          to: rqwbuser,
          sub: emailBody.subject,
          body: emailBody.body
        }
        await utils.requestToQuizServer('send_mail', emailRequest)
        res.success({ message: "Instructions to reset password sent on email" })
      } else {
        throw utils.generateError('notAllowed', 'Use social account');
      }
    } else {
      throw utils.generateError('notActive', 'Account is not active');
    }
  } catch (err) {
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }
}
module.exports.sendResetPwdEmail = sendResetPwdEmail;

let resetPwd = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      requiredFields: ['wbuser', 'password', 'emailToken'],
      validFields: ['wbuser', 'password', 'emailToken'],
      acceptBlank: false
    })
    let rqwbuser = req.body.wbuser;
    let rqpassword = req.body.password;
    let rqemailtoken = req.body.emailToken;
    let doc = await userDetailObject(rqwbuser);  //   await userDetailObject(rqwbuser);
    let data = await checkIfUserIsActive(doc);
    if (data.emailToken === rqemailtoken) {
      // todo validate password 
      data.password = await hashPassword(rqpassword);
      data.pwdChanged = new Date();
      data.emailToken = await generateEmailToken();
      // TODO send email on password change
      await usDb.insert(data);
      res.success({ message: "Password reset successfully" })
    } else {
      throw utils.generateError('tokenInvalid', 'Reset password token did not match ');
    }
  } catch (err) {
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }
}
module.exports.resetPwd = resetPwd;

let login = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      requiredFields: ['password', 'wbuser'],
      validFields: ['password', 'wbuser'],
      acceptBlank: false
    })
    let validUsername;
    let rqwbuser = req.body.wbuser;
    let rqpassword = req.body.password;
    let doc = await userDetailObject(rqwbuser)   // usDb.get(rqwbuser)
    let data = await checkIfUserIsActive(doc)
    if (data.regType == "email") {
      if (comparePassword(rqpassword, data.password)) {
        // jwt 
        validUsername = data.wbuser
        // TODO rememberme feature
        let result = await utils.generateJWT({ username: data.wbuser, });
        res.cookie("usr-tkn", result, {
          maxAge: await config.get("cookieMaxAge"), //  2 days
          httpOnly: true,
          secure: false
        });
        let betaStoreAccess = await wbDetails.checkBetaAccessFlag(rqwbuser);

let udata =  {email: doc.wbuser, image: doc.image, status: doc.status, createdOn: doc.createdOn, name: doc.name, country: doc.country, contact : doc.phone, regType: doc.regType};



        res.success({ message: "Logged in successfully",  userData: udata,  token: result, user: validUsername, loginType: 'email', "isBetaUser": betaStoreAccess })
      } else {
        throw utils.generateError('passwordInvalid', 'Password did not match');
      }
    } else {
      throw utils.generateError('notAllowed', 'Use social account');
    }
  } catch (err) {
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }
}
module.exports.login = login;


const { OAuth2Client } = require('google-auth-library');


let checkAccessToken = async (regType, email, accessToken) => {
  // throw utils.generateError('invalidAuthToken', 'Invalid auth token');
  const client = new OAuth2Client(await config.get('gmailClientId'));
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: accessToken,
      audience: client,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    //console.log(".............")
    // console.log(userid)
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
  }
  verify().catch(console.error);  // fix 

  return true
}

let socialLogin = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      requiredFields: ['type', 'id', 'email', 'accessToken'],
      validFields: ['type', 'id', 'email', 'name', 'image', 'accessToken', 'country', 'idToken'],
      acceptBlank: false
    })

    // check if type is valid: 
    let validTypes = await config.get('socialLoginTypes')
    if (validTypes.indexOf(req.body.type) == -1) {
      throw utils.generateError('typeInvalid', 'Invalid social login plugin');
    }

    //_design/web/_view/idToDoc
    let userRecs = await usDb.view('web', 'idToDoc', { key: req.body.email })
    let userRecord;
    if (userRecs.rows.length == 0) {
      //  exists
      // check if the auth token provided is valid 
      userRecord = {
        _id: await utils.getNewUserId(),
        createdOn: utils.getCurrentDateInUTC(),
        regType: req.body.type,
        name: req.body.name?req.body.name:" ",
        regDetails: JSON.parse(JSON.stringify(req.body)),
        country: req.body.country ? req.body.country : 'India',
        status: 1,
        wbuser: req.body.email,
        image: await  config.get("defaultUserImageBase64")
      }

    } else {
      userRecord = userRecs.rows[0]['value']
      if (userRecord['regType'] != req.body.type) {
        throw utils.generateError('typeInvalid', 'This social account is not linked.'); // add reg tye
      }
      // this can be rremoved
      if (!userRecord.regType) {
        userRecord['regType'] = 'email'
      }
    }


    if (userRecord.regType != 'email') {
      // verify accesstoken everytime on login 
      await checkAccessToken(userRecord.regType, userRecord.email, req.body.idToken)
      userRecord['regDetails']['accessToken'] = req.body.accessToken;
      await usDb.insert(userRecord);

      // generating JWT
      let result = await utils.generateJWT({ username: userRecord.wbuser, });
      res.cookie("usr-tkn", result, {
        maxAge: await config.get("cookieMaxAge"), //  2 days
        httpOnly: true,
        secure: false
      });

      let betaStoreAccess = await wbDetails.checkBetaAccessFlag(req.body.email);



      let udata =  {email: userRecord.wbuser, image: userRecord.image, status: userRecord.status, createdOn: userRecord.createdOn, name: userRecord.name, country: userRecord.country, contact : userRecord.phone, regType: userRecord.regType};

      
      res.success({ message: "Logged in successfully",  userData: udata, token: result, user: userRecord.wbuser, loginType: req.body.type, "isBetaUser": betaStoreAccess })

    } else {
      throw utils.generateError('invalidLogin', 'Login through this method not allowed. Your account is not connected to 3rd party account. Use password instead');
    }
  } catch (err) {
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }
}
module.exports.socialLogin = socialLogin;





let getUserDetails = async (req, res, next) => {
  try {
    let rqwbuser = req.params.wbuser;
    let data1 = await userDetailObject(rqwbuser) //usDb.get(rqwbuser);
    let data = await checkIfUserIsActive(data1)


    res.success({ _id: data._id, email: data.wbuser, image: data.image, status: data.status, createdOn: data.createdOn, name: data.name, country: data.country, contact : data.phone, regType: data.regType });
  } catch (err) {
    console.log(err)
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }

}
module.exports.getUserDetails = getUserDetails;



let getUserMeta = async (req, res, next) => {
  try {
    let rqwbuser = req.params.wbuser;
    let data1 = await userDetailObject(rqwbuser) //usDb.get(rqwbuser);
    let data = await checkIfUserIsActive(data1)
    // await utils.inspectJSON(req.body)
    res.success({ meta : data['meta']?data['meta']:{} });
  } catch (err) {
    console.log(err)
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }

}
module.exports.getUserMeta = getUserMeta;


const subDb = nano.db.use('wbsubscriptions');

let getAdditionalData = async (req, res, next) => {
  try {
    let subscribed = []
    let sdata = {}
    // if( req.valid_username ){
    //   let subDb = await subDb.view('web', 'wbuserToDoc', { key: req.valid_username})
    //   subDb.map(itm=>{
    //     subscribed.push(itm.value['wbid'])
    //   })
    // }
    let subDb1 = await subDb.view('web', 'wbuserToDoc', { key: req.params.wbuser })
    //console.log(subDb1)
    subDb1.rows.map(itm => {
      subscribed.push(itm.value['wbId'])
      sdata[itm.value['wbId']] = itm['id']
    })
    let betaStoreAccess = await wbDetails.checkBetaAccessFlag(req.params.wbuser);
    res.success({ wblist: subscribed, isBetaUser: betaStoreAccess, wbDets:sdata  })


  } catch (error) {
    res.error(error)
  }
}
module.exports.getAdditionalData = getAdditionalData;


let updateUserDetails = async (req, res, next) => {
  try {
    let rqwbuser = req.params.wbuser;
    let obj = req.body;
    if (obj.password) {
      // todo compare password 
      obj.password = await hashPassword(obj.password)
      // todo send email on pwd change
    }
    await utils.inspectJSON(obj, {
      validFields: ['password', 'name', 'image','country','phone'],
      acceptBlank: false
    })
    let doc = await userDetailObject(rqwbuser)
    let userdata = await checkIfUserIsActive(doc)
    
    if(obj['currentPassword']){
      delete obj['currentPassword']
    }
    
    Object.keys(obj).forEach(function (key) {
      userdata[key] = obj[key];
    });
    await usDb.insert(userdata);
    res.success({ message: "User details updated" })
  } catch (err) {
    console.log(err)
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }

}
module.exports.updateUserDetails = updateUserDetails;


let updateUserMeta = async (req, res, next) => {
  try {
    let rqwbuser = req.params.wbuser;
    let obj = req.body;
    // await utils.inspectJSON(obj, {
    //   validFields: ['password', 'name', 'image','country','currentPassword','phone'],
    //   acceptBlank: false
    // })
    let doc = await userDetailObject(rqwbuser)
    let userdata = await checkIfUserIsActive(doc)
    if(userdata['meta']){
      Object.keys(obj).forEach(function (key) {
        userdata['meta'][key] = obj[key];
      });
    }else{
      userdata['meta'] = obj;
    }
    await usDb.insert(userdata);
    res.success({ message: "User meta updated" })
  } catch (err) {
    console.log(err)
    if (err.statusCode == 404) {
      res.error(utils.generateError('notFound', 'User does not exists'));
    } else {
      res.error(err)
    }
  }
}
module.exports.updateUserMeta = updateUserMeta;

let userAvailable = (wbuser) => {
  // wbuser corresponds to the `_id` field which is also the email id
  return new Promise(async (resolve, reject) => {
    let wserdb = await usDb.view('web', 'emailToDoc', { key: wbuser });
    if (wserdb.rows.length > 0) {
      reject(utils.generateError('recordExists', 'User exists'))
    } else {
      resolve();
    }
  })
}

let hashPassword = async (pwd) => {
  // TODO add password validation here
  let saltRounds = await config.get('pwdSaltRounds');
  var salt = bcrypt1.genSaltSync(saltRounds);
  var hash = bcrypt1.hashSync(pwd, salt);
  // var hash = bcrypt.hashSync(pwd, saltRounds);
  return hash;
}

let comparePassword = (input, passwordHash) => {
  return bcrypt1.compareSync(input, passwordHash);
}

let generateEmailToken =  async () => {
  return rn({ min: await config.get("emailPinMin"), max: await config.get("emailPinMax"), integer: true }) + ''
}

let checkIfUserIsActive = (doc) => {
  // account is active only if status is 1
  return new Promise((resolve, reject) => {
    if (doc.status == -1) {
      reject(utils.generateError('blocked', 'Your account is blocked'))
    } else if (doc.status == 0) {
      reject(utils.generateError('inactive', 'Your account is inactive. Verify email first'))
    } else if (doc.status == 1) {
      resolve(doc)
    }
  })
}

let showImg = async (req, res, next) => {
  let rqwbuser = req.params.wbuser;
  // https://203.18.51.20:6984/_utils/database.html?wbusers/_design/web/_view/emailToDoc
  let viewdata = await usDb.view('web', 'emailToDoc', { key: rqwbuser })
  if (viewdata.rows.length > 0) {
    let udata = viewdata.rows[0].value;
    var parts = udata['image'].split(',')[1];
    let ctype = udata['image'].split(';base64,')[0].split(':')[1]
    const img = Buffer.from(parts, 'base64');
    res.writeHead(200, {
      'Content-Type': ctype ,
      'Content-Length': img.length
    });
    res.end(img);
  } else {
    res.error(utils.generateError('notFound', 'User does not exists'));
  }
}
module.exports.showImg = showImg