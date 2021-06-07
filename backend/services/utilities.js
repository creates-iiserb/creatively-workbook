const request = require("request");
const config = require('./config');
const jwt = require('jsonwebtoken');
const nano = require('nano')(config.getEnv('dbServer'));
const subDb = nano.db.use('wbsubscriptions');
const wbDb = nano.db.use('wbpublished');
const userDb = nano.db.use('wbusers');
const wsDb = nano.db.use('worksheets')

var passwordValidator = require('password-validator');
var validator = require("email-validator");
const { getCode, getName } = require('country-list');

// var passwordNotAllowed = config.get(passwordNotAllowed);


let generateError = (code, message) => {
    // use this method to respond with a error object inside services and models 
    // let message = config.getInner(code)
    return new Error(code + "#@#" + message + "#@#");
};
module.exports.generateError = generateError;

let inspectJSON = (input, config1) => {
    // to inspect a javascript object , config can take - requiredFields(array), validFields(array),acceptBlank(boolean)
    return new Promise(async function (resolve, reject) {
        if (config1.requiredFields) {
            let allReqFields = true;
            let paswordValidate = true;
            let wbuserValidate = true;
            let reqFieldMissing = [];
            config1.requiredFields.forEach((element) => {
                // loop throught all required fields to check wheter they exist in the JSON or not

                if (!input[element]) {
                    allReqFields = false;
                    reqFieldMissing.push("" + element);
                }
            });
            if (!allReqFields) {
                // some required fields are missing
                reject(generateError('validationError', "Required field(s) - " + reqFieldMissing));
            }
        }
        let varfields = config1.validFields;
        let invalid = false, ifields = "";
        // check if input is blank, error if blank
        if (!input || Object.keys(input).length <= 0) {
            if (config1.acceptBlank == true) {
                resolve();
            } else {
                reject(generateError("jsonEmpty", "Input is empty"));
            }
        }
        Object.keys(input).forEach(function (key) {

            if (typeof input[key] == 'boolean') {
                // console.log("boolean")
            } else {

                if (input[key].length == 0) {
                    invalid = true;
                    ifields += key + " , ";
                }
                else if (!varfields.includes(key)) {
                    invalid = true;
                    ifields += key + " , ";
                }
            }
        });
        // if invalid flag is set, some invalid fields exists in the json
        if (invalid) {
            // console.log("invalid" + invalid)
            reject(generateError('validationError', "Invalid fields - " + ifields + " Valid fields -  " + config1.validFields));
        } else {
            let jsonValid = true;
            // console.log("test input " + JSON.stringify(input))
            if (input.password) {
                var schema = new passwordValidator();
                schema
                    .is().min(8)                                    // Minimum length 8
                    .is().max(100)                                  // Maximum length 100
                    .has().uppercase()                              // Must have uppercase letters
                    .has().lowercase()                              // Must have lowercase letters
                    .has().digits()                                 // Must have digits
                    .has().not().spaces()                           // Should not have spaces
                    .is().not().oneOf(await config.get('passwordNotAllowed')); // Blacklist these values
                if (!schema.validate(input.password)) {
                    jsonValid = false;
                    reject(generateError('validationError', "Password must satisfy following criteria - " + schema.validate(input.password, { list: true }).join(',')))
                }
                // if yes validate the password
            }
            if (input.wbuser) {
                // console.log("wbuser"+input.wbuser)
                if (!validator.validate(input.wbuser)) {
                    jsonValid = false;
                    reject(generateError('validationError', "Invalid Email"))
                }
            }
            if (input.country) {
                let countryCode = getCode(input.country);
                if (!countryCode) {
                    jsonValid = false;
                    reject(generateError('validationError', "Enter a valid country name"))
                }
            }
            if (jsonValid) {
                resolve()
            }
        }
    });
}
module.exports.inspectJSON = inspectJSON;

let requestToQuizServer = (type, data) => {
    return new Promise(async (resolve, reject) => {
        let dataToSend = { type: type, data: data };
        let reqBody = {
            url: await config.get('quizServer'),
            timeout: 25000,
            method: "POST",
            body: '**jsonBegin' + JSON.stringify(dataToSend) + 'jsonEnd*****11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111'
        };
        request(reqBody, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                let responseBody = JSON.parse(body);
                if (responseBody.error) {
                    reject(responseBody.error)
                } else {
                    if (responseBody.result.error) {
                        reject(responseBody.result.error)
                    } else {
                        resolve(responseBody.result)
                    }
                }
            }
        })
    })
}

module.exports.requestToQuizServer = requestToQuizServer;



let generateJWT = async (data) => {
    let token = jwt.sign({
        expiresIn: await config.get('tokenValidity'),
        data: data,
    }, await config.get('tokenSigner'));
    return token
}
module.exports.generateJWT = generateJWT;

let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let getCurrentDateInUTC = () => {
    // get the current date in db format
    let dt = new Date();
    let cdate = month[dt.getUTCMonth()] + " " + dt.getUTCDate() + " " + dt.getUTCFullYear() + " " + dt.getUTCHours() + ":" + dt.getUTCMinutes() + ":" + dt.getUTCSeconds() + " UTC"
    return cdate;
}
module.exports.getCurrentDateInUTC = getCurrentDateInUTC;

let convertDateInUTC = (date) => {
    // to convert a given date into the format in which the date is being stored in the database 
    // Example - Jan 12 10 2018 12:23:00 UTC 
    let dt = new Date(date);
    let cdate = month[dt.getUTCMonth()] + " " + dt.getUTCDate() + " " + dt.getUTCFullYear() + " " + dt.getUTCHours() + ":" + dt.getUTCMinutes() + ":" + dt.getUTCSeconds() + " UTC"
    return cdate;
}
module.exports.convertDateInUTC = convertDateInUTC;

let addDaysToDate = (date, dayToAdd) => {
    var someDate = new Date(date);
    someDate.setDate(someDate.getDate() + dayToAdd);
    return convertDateInUTC(someDate); // to convert it in the db format
}
module.exports.addDaysToDate = addDaysToDate;

let daysBetween = function (date1, date2) {
    //Get 1 day in milliseconds
    var one_day = 1000 * 60 * 60 * 24;
    // Convert both dates to milliseconds
    var date1_ms = new Date(date1).getTime();
    var date2_ms = new Date(date2).getTime();
    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;
    // Convert back to days and return
    return Math.round(difference_ms / one_day);
}
module.exports.daysBetween = daysBetween;


let filterJSON = (inputJSON, options) => {
    // options - outputFields 
}



let checkSubscriptionValidityPeriod = async (startDate, period) => {
    let endDate = addDaysToDate(startDate, period),
        currentDate = getCurrentDateInUTC();
    let crrgreaterstart = new Date(startDate) <= new Date(currentDate);
    let endgreatercurr = new Date(currentDate) <= new Date(endDate);

    let validity = crrgreaterstart && endgreatercurr;
    // subsrAllowedDate = subtract config.daysBeforeSubscrEnds from enddate  , 
    // daysToAddToNewPeriod = if validity is true ,end date - current date, else if validity is false, will be 0 
    // subscrAllowed - true if current date is greater than or equal to subsrAllowedDate
    // validity = subscription validity
    let earlyRenewalDate = new Date(endDate);
    earlyRenewalDate.setDate(earlyRenewalDate.getDate() - await config.get('daysBeforeSubscrEnds'));
    let earlyRenewal = false;

    // ASSUMPTION : validity period of a workbook is always greater than config.daysBeforeSubscrEnds
    let d1 = earlyRenewalDate <= new Date(currentDate);
    let d2 = new Date(currentDate) <= new Date(endDate);
    earlyRenewal = d1 && d2
    let daysToAddToNewPeriod;
    if (validity && earlyRenewal) {
        daysToAddToNewPeriod = daysBetween(currentDate, endDate)
    }
    let result = {};
    if (validity) {
        result = {
            startDate: startDate,
            validity: validity, //current  subscription validity
            endDate: endDate,  // when the curr subsr ends
            earlyRenewalDate: convertDateInUTC(earlyRenewalDate),
            daysToAddToNewPeriod: daysToAddToNewPeriod,
            earlyRenewal: earlyRenewal,
            currentDate: currentDate
        };
    } else {
        result = {
            validity: validity, //current  subscription validity
        };
    }
    return result
}

module.exports.checkSubscriptionValidityPeriod = checkSubscriptionValidityPeriod

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


let checkSubscriptionValidityObj = async (wbuser, wbid) => {
    try {
        let data;
        let body = await subDb.view('web', 'subIdWbuserToDoc', { key: wbid + "-" + wbuser });
        // console.log(body)
        if (body.rows.length > 0) {
            data = body.rows[0].value;
            if (data.beta) {
                let betaAccessCheck = await checkBetaAccess(wbuser, data['curSubr'].pubId)

            }
            let check = await checkSubscriptionValidityPeriod(data.curSubr.date, data.curSubr.period);
            data['validity'] = check;
            return data
            // else {
            //     throw generateError('subsrOver', 'Your subscription period got over on ' + check.endDate);
            // }
        } else {
            throw generateError("notFound", "Subscription does not exists!")
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}
module.exports.checkSubscriptionValidityObj = checkSubscriptionValidityObj;


let checkSubscriptionValidity = async (wbuser, wbid) => {
    try {
        let data;
        let body = await subDb.view('web', 'subIdWbuserToDoc', { key: wbid + "-" + wbuser });
        // console.log(body)
        if (body.rows.length > 0) {
            data = body.rows[0].value;
            if (data.beta) {
                let betaAccessCheck = await checkBetaAccess(wbuser, data['curSubr'].pubId)

            }
            let check = await checkSubscriptionValidityPeriod(data.curSubr.date, data.curSubr.period);
            if (check.validity) {
                data['validity'] = check;
                return data
            } else {
                throw generateError('subsrOver', 'Your subscription period got over on ' + check.endDate);
            }
        } else {
            throw generateError("notFound", "Subscription does not exists!")
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}
module.exports.checkSubscriptionValidity = checkSubscriptionValidity;



let composeEmail = async (name, data) => {
    // name - name of mail template , data - data to fill in the placeholders
    // get mail template from config
    // get common mail header/styling from config
    // complie the mail template including by first generating the email and replacing placeholders with data
    // return email template as a string
    let mailTemplate = await config.getInner("mailTemplates", name);
    let masterTemplate = await config.get('mailBody')
    let emailBody = masterTemplate.replaceAll('%%content%%', mailTemplate.body)
    let formatBegin = "%", formatEnd = "%";
    // iterate through data keys 
    Object.keys(data).map((key) => {
        let toFind = formatBegin + key + formatEnd;
        emailBody = emailBody.replaceAll(toFind, data[key]);
    });
    // console.log(emailBody)
    return { subject: mailTemplate.subject, body: emailBody }
}
module.exports.composeEmail = composeEmail;

//   let composeEmail = (subjectTemp, bodyTemp, data,cc) => {
//   // compose email , returns json with fields - email,subject,body
//     // subjectTemp - template of the subject
//     // bodyTemp - template of the email body
//     // data - json data containing all the fields mentioned in replacement array,
//     // cc - array of email id to which the email is to be cc'ed 
//     // the format of how field will be specified in 'subjectTemp' and 'bodyTemp'
//     let emailData = {};
//     // the email of the sender must also be in the 'data' field
//     emailData.email = data.email; 
//     emailData.cc = cc;
//     let sbj = subjectTemp,bdy = bodyTemp;
//     // iterate through data keys 
//     Object.keys(data).map((key) => {
//       let toFind = formatBegin + key + formatEnd;
//       sbj = sbj.replaceAll(toFind, data[key]);
//       bdy = bdy.replaceAll(toFind, data[key]);
//     });
//     emailData.subject = sbj;
//     emailData.body = bdy;
//     return emailData;
//   }
//   // examples - 
//   let e1 = composeEmail("Hello <%name%> ", "Your marks = <%marks%>", {
//     name: "Abc",
//     marks: 12,
//     email:"example1@test.com"
//   },['me@me.com','you@you.com'])
//   let e2 = composeEmail("Hello <b><%name%></b> Hi <%last%> ", "<p>Your marks = <%marks%>. </p><p>your last name is <%last%></p>", {
//     name: "Abc",
//     last: "Qwerty",
//     some:1,
//     marks: 12,
//     email: "example2@test.com"
//   })
//   console.log(e1);
//   console.log(e2);

let checkBetaUserExistsInWorkbookDB = async (wbuser, pubId) => {
    // input - wbuser, wbid - wbid must not include _beta
    // to check if a wbuser is allowed to subscribe to a beta worksheet
    try {
        let data = await wbDb.view('web', 'betaUserToId', { key: wbuser });
        if (data.rows.length > 0) {
            // check if given wb exists in the data fetched
            let findWbIdInRow = () => {
                return data.rows.find(itm => {
                    return itm.value == wbid
                })
            }
            if (findWbIdInRow()) {
                return;
            } else {
                throw generateError('notAllowed', 'User is not allowed to get this workbook in beta mode')
            }
        } else {
            throw generateError('notFound', 'No beta worksheets available for the user')
        }
    } catch (error) {
        throw error
    }
}
module.exports.checkBetaUserExistsInWorkbookDB = checkBetaUserExistsInWorkbookDB;


let checkBetaAccess = async (wbuser, pubId) => {
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });
        if (data.rows.length > 0) {
            let findPub = (itm) => { return (itm['value']['pubId'] == pubId) }
            let a = data.rows.filter(findPub);
            if (a.length > 0) {
                return true
                // let wbDetails = await getWBDetails(a[0]['value'].wbId, a[0]['value'].pubId);
                // return genPubDetails(wbDetails)
            } else {
                throw generateError("notFound", "You are no longer a beta tester in the workbook")
            }
        } else {
            throw generateError("notFound", "You are not a beta user.")
        }
    } catch (error) {
        throw error
    }
}
module.exports.checkBetaAccess = checkBetaAccess;

let checkBetaAccessBoolean = async (wbuser, pubId) => {
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });
        if (data.rows.length > 0) {
            let findPub = (itm) => { return (itm['value']['pubId'] == pubId) }
            let a = data.rows.filter(findPub);
            if (a.length > 0) {
                return true
                // let wbDetails = await getWBDetails(a[0]['value'].wbId, a[0]['value'].pubId);
                // return genPubDetails(wbDetails)
            } else {
                return false
                // throw util.generateError("notFound", "You are no longer a beta tester in the workbook")
            }
        } else {
            return false
        }
    } catch (error) {
        throw error
    }
}
module.exports.checkBetaAccessBoolean = checkBetaAccessBoolean;

let checkSubscriptionExists = async (input) => {
    // returns true, subsrid if subscription exists , else false
    try {
        let checkData = await subDb.view('web', 'checkSubsrExists', { key: input.wbuser + '-' + input.wbid });
        let recordExists = false;
        let subrId = ''
        if (checkData.rows.length > 0) {
            recordExists = true;
            subrId = checkData.rows[0].value._id
        }
        return { exists: recordExists, subrId: subrId }
    } catch (error) {
        //todoerror
        throw error
    }
}
module.exports.checkSubscriptionExists = checkSubscriptionExists;

let checkUserExists = async (wbuser) => {
    // returns true, subsrid if subscription exists , else false
    try {
        let checkData = await userDb.view('web', 'idToDoc', { key: wbuser });
        let recordExists = false;
        let data;
        if (checkData.rows.length > 0) {
            recordExists = true;
            data = checkData.rows[0].value
        }
        return { exists: recordExists, data: data }
    } catch (error) {
        //todoerror
        throw error
    }
}
module.exports.checkUserExists = checkUserExists;

let getWbDetails = async (wbid) => {
    try {
        let viewData = await wbDb.view('web', 'idToPublicData', { key: wbid });
        if (viewData.rows.length == 1) {
            let wbData = viewData.rows[0].value
            // console.log(wbData)
            let wbDetails = {
                name: wbData.name,
                version: wbData.latestVer,
                price: wbData.pricing.price,
                period: wbData.pricing.period,
                betaVersion: wbData.latestBetaVer,
                betaPeriod: wbData.betaPeriod
            }
            return wbDetails
        } else {
            throw generateError('notFound', 'Workbook not found')
        }
    } catch (error) {
        throw error
    }
}
module.exports.getWbDetails = getWbDetails;


let getNewWorksheetId = async () => {
    try {
        let maxCount = await wsDb.view('byAdmin', 'getAvailableId');
        if (maxCount) {
            let newId = maxCount.rows[0].value + 1;
            let newId5 = "0000".concat(newId.toString(36)).slice(-5)
            // console.log("New ws id = " + newId5)
            return newId5
        } else {
            throw generateError('', '')
        }
    } catch (error) {
        throw error
    }
}
module.exports.getNewWorksheetId = getNewWorksheetId;


let packageObject = (orignalObj, fields) => {
    let newObj;

}
module.exports.packageObject = packageObject;


let getNewUserId = async () => {
    try {
        let maxCount = await userDb.view('byAdmin', 'getAvailableId');
        if (maxCount) {
            let newId = maxCount.rows[0].value + 1;
            let newId5 = "0000".concat(newId.toString(36)).slice(-5)
            // console.log("New ws id = " + newId5)
            return newId5
        } else {
            throw generateError('', '')
        }
    } catch (error) {
        throw error
    }
}
module.exports.getNewUserId = getNewUserId;



let userDetailObject = async (wbuser) => {
    try {
        let wserdb = await userDb.view('web', 'emailToDoc', { key: wbuser });
        if (wserdb.rows.length > 0) {
            return wserdb.rows[0]['value']
        } else {
            throw generateError('recordNotExists', 'User does not exists')
        }
    } catch (error) {
        throw error
    }

}
module.exports.userDetailObject = userDetailObject

let generateTokenN = (length) => {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
module.exports.generateTokenN = generateTokenN

let generateRatingDoc = (entries) => {
    let value = entries;
    let s1 = value.length == 0 ? 0 : value.filter(item => item.rating == 1).length,
        s2 = value.length == 0 ? 0 : value.filter(item => item.rating == 2).length,
        s3 = value.length == 0 ? 0 : value.filter(item => item.rating == 3).length,
        s4 = value.length == 0 ? 0 : value.filter(item => item.rating == 4).length,
        s5 = value.length == 0 ? 0 : value.filter(item => item.rating == 5).length
    let ratingsData = {
        "5star": s5,
        "4star": s4,
        "3star": s3,
        "2star": s2,
        "1star": s1,
        "totalRatings": parseFloat( value.length == 0 ? 0 : ((5 * s5 + 4 * s4 + 3 * s3 + 2 * s2 + 1 * s1) / (s1 + s2 + s3 + s4 + s5)).toFixed(1)),
        "count":entries.length
    };
    return ratingsData
}
module.exports.generateRatingDoc = generateRatingDoc