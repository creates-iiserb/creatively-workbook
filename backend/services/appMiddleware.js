// const config = require('./config');
const utils = require('./utilities');
const jwt = require('jsonwebtoken');
const nano = require('nano')({ url: config.getEnv('dbServer') });
const usDb = nano.db.use('wbusers');

responseHandler = (req, res, next) => {
    /*
     * This middleware adds two methods in the response object - success and error.
     * These functions must be used in the API controllers to respond to a request. 
     */
    res.success = (data) => {
        res.json({
            success: true,
            data: data
        });
    };
    res.error = (err, code, message) => {
        if (err) {
            next(err);
        } else {
            next(Error(code + "#@#" + message));
        }
    }
    next();
}

module.exports.responseHandler = responseHandler;

let enableCORS = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,fields,usr-tkn");
    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE,GET")
        return res.status(200).json({});
    }
    next();
}

module.exports.enableCORS = enableCORS;

let validateToken = (token) => {
    return new Promise(async (resolve, reject) => {
        if (token) {
            let secCode = await config.get("tokenSigner")
            jwt.verify(token, secCode, async function  (err, decoded) {
                if (err) {
                    reject(utils.generateError('unauthorized', "Failed to authenticate token.Login again"));
                } else {
                    // check if user exists in db
                    try {
                        let udata = await utils.userDetailObject(decoded.data.username);
                        if (udata.status == 1) {
                            resolve(decoded.data)
                        } else {
                            reject(utils.generateError('notActive', 'User inactive'));

                        }
                    } catch (error) {
                        if (error.statusCode == 404) {
                            reject(utils.generateError('notFound', 'User does not exists'));
                        } else {
                            reject(error)
                        }
                    }
                }
            });
        } else {
            reject(utils.generateError('unauthorized', "No token provided"));
        }
    })
}

let needAuthentication =  (req, res, next) => {
    let userheadername = "usr-tkn";
    var token = req.body[userheadername] || req.query.token || req.headers[userheadername] || req.cookies[userheadername];
    //console.log(token)
    validateToken(token)
        .then(function (data) {
            req.valid_username = data.username;
            next();
        })
        .catch(function (error) {
            console.log(error);
            res.error(error);
        });
}
module.exports.needAuthentication = needAuthentication



let secureAndPrivateForUser = (req, res, next) => {
    var paramUname = req.params.wbuser;
    let userheadername = "usr-tkn";
    var token = req.body[userheadername] || req.query.token || req.headers[userheadername] || req.cookies[userheadername];
    validateToken(token)
        .then(function (data) {
            req.valid_username = data.username;
        })
        .then(function () {
            return compareUname(req.valid_username, paramUname)
        })
        .then(function () {
            next();
        })
        .catch(function (error) {
            res.error(error)
        });
}
module.exports.secureAndPrivateForUser = secureAndPrivateForUser

function compareUname(pname, uname) {
    return new Promise(function (resolve, reject) {
        if (pname === uname) {
            resolve();
        } else {
            reject(Error("Unauthorized access"));
        }
    });
}