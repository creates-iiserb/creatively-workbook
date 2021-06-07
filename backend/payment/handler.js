var ejs = require('ejs');
var fs = require('fs');
var path = require('path');

// const config = require('../services/config');
const nano = require('nano')(config.getEnv('dbServer'));

const subDb = nano.db.use('wbsubscriptions');
const txnDb = nano.db.use('wbtransactions');

const wbdets = require('../services/wbDetails');
const utils = require('../services/utilities');

// TODO authentication

function toHTML(ejsTemplateURL, data) {
    return new Promise(function (resolve, reject) {
        // console.log(path.join(rootDirLoc,ejsTemplateURL))
        fs.readFile(path.join(rootDirLoc, ejsTemplateURL), 'utf8', function (error, response) {
            if (error) {
                reject(error);
            }
            else {
                var html = ejs.render(response, data);
                resolve(html);
            }
        });
    });
}


let failedTxnList = async (wbuser, subId) => {
    let dbview = await txnDb.view('web', 'wbusersubidtofailedtxn', { key: wbuser + "-" + subId });
    if (dbview.rows.length > 0) {
        let data = dbview.rows[0];
        return { status: true, data: data }
    } else {
        return { status: false }
    }
}

let getDetails = async (input) => {
    try {
        let subExists = await utils.checkSubscriptionValidityObj(input.wbuser, input.subID)
       // console.log(subExists)
        let pGateWays = await config.get('payGatewayList')
        let redUrl = await  config.get('redirectToGatewayUrl')
        let supportEmail = await  config.get('supportEmail')
        let wbHome = await  config.getInner('frontEndUrl','wbpage')
        let wbDets = await wbdets.getWBDetails(subExists['wbId'], subExists['curSubr']['pubId']);
        let failedTxn = await failedTxnList(input.wbuser, input.subID)

        return {supportEmail:supportEmail,  wbHomeUrl:wbHome, redirectUrl: redUrl, subExists: subExists, pGateWays: pGateWays, wbDets: wbDets, failedTxn: failedTxn }
    } catch (error) {
        throw error
    }
}



let checkSubAllowed = async (wbuser, subid) => {
    try {
        let subExists = await utils.checkSubscriptionValidity(input.wbuser, input.subID);
        // console.log(subExists)
    } catch (error) {
        throw error
    }
}

module.exports.loadPaymentPage = async (req, res, next) => {
    try {
        let input = {
            subID: req.params['subID'],
            wbuser: req.params['wbuser'],
            auth: req.params['authtoken']
        }
        let data = await getDetails(input);
        data['authTk'] = input['auth'];
        data['wbuser'] = input['wbuser']

        // console.log(data)

        let page = await toHTML('payment/paymentPage.ejs', data)
        res.send(page)
    } catch (error) {
        console.log(error)
        let page = await toHTML('payment/errorPage.ejs', {})
        res.send(page)
    }
}


let renewFreeSubscription = async (input) => {
    try {
        let data = await getDetails(input);
        let subDoc = await subDb.get(data['subExists']['_id']);
        let pubDets = data['wbDets'];
        // current subscritbtion can be free or paid :
        // free subscrip can be continued to free any time 
        if (data['subExists']['validity']['validity'] == false || (data['subExists']['validity']['validity'] == true && data['subExists']['validity']['earlyRenewal'] == true)) {
            let newCurrSubr = {
                "date": utils.getCurrentDateInUTC(),
                "pubId": pubDets['_id'],
                "version": pubDets['version'],
                "period": pubDets['pricing']['period'],
                "type": "free",
                "txn": "free"
            }
            subDoc['subrHist'].push(JSON.parse(JSON.stringify(subDoc['curSubr'])))
            subDoc['curSubr'] = JSON.parse(JSON.stringify(newCurrSubr));
            await subDb.insert(subDoc);
            return { status: true, msg: "Your subscription is renewed for " + pubDets['pricing']['period'] + " days." }
        } else {
            return { status: true, msg: "Your free subscription was already renewed for " + pubDets['pricing']['period'] + " days on " + data['subExists']['curSubr']['date'] + ". Try after " + data['subExists']['validity']['earlyRenewalDate'] }
        }

    } catch (error) {
        throw error
    }
}



let updateTxnStep = async (id, newStep, data) => {
    try {
        //console.log(id)
        let txnDoc = await txnDb.get(id);
        //console.log(txnDoc)
        if (!txnDoc['history']) {
            txnDoc['history'] = []
        };
        // console.log(txnDoc)
        txnDoc['history'].push({ status: txnDoc['status'], date: txnDoc['date'], orderId :txnDoc['orderId']?txnDoc['orderId']:"not_generated"  })
        txnDoc['status'] = newStep;
        txnDoc['date'] = utils.getCurrentDateInUTC();
        if (data) {
            Object.keys(data).map(itm => {
                txnDoc[itm] = data[itm]
            })
        }

        await txnDb.insert(txnDoc)
        return { success: true }
    } catch (error) {
        console.log(error)
        throw error
    }
}


let gateways = {
    'fakepay': {
        'redirect': async (input) => {
            var params = {};
            // console.log(input)
            //params['MID'] = PaytmConfig.mid;
            //params['WEBSITE'] = PaytmConfig.website;
            let gdata = await config.getInner('gatewayConfigs', 'fakepay');
            // generate order id and add it into the document 
            // let  getRandomArbitrary = (min, max) =>{return Math.random() * (max - min) + min;}
            let getRandomInt = (min, max) => {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min)) + min;
            }
            let orderId = input.subExists['_id'] + "" + input.subExists['curSubr']['pubId'] + "" + getRandomInt(10005, 99999)
            // subscripter id + publication id + 4 random digit 
            await updateTxnStep(input['input']['txnDocId'], 'orderIdGenerated', { orderId: orderId })
            params = {
                'EMAIL': input.subExists['wbuser'],
                'CUST_ID': input.subExists.wbuser,
                'TXN_AMOUNT': input['wbDets']['pricing'].price,
                'CALLBACK_URL': gdata['callBackURL'] + "/" + input['input']['txnDocId'],
                'ORDER_ID': orderId
            }
            var txn_url = gdata['gatewayURL']
            var form_fields = "";
            for (var x in params) {
                form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
            }
            return '<h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script>';
        },
        'process': async (input) => {
            // check here if the prices match or not
            // console.log("in process")
            // { status: 'true', data: 'buffer' }
            // console.log(input)
            input['dataencoded'] = JSON.parse(Buffer.from(input['data'], 'base64').toString())
            await updateTxnStep(input['txnId'], 'callBackFromGateway', { details: input })
            let succs;
            // TODO check pricing details with wbdetails 
            if (input['status']=="true") {
                //console.log("success from fakepay")
                await updateTxnStep(input['txnId'], 'success', {})
                succs = { success: true }
            } else {
                await updateTxnStep(input['txnId'], 'failure', {})
                succs = { success: false }
            }
            return succs
        }
    }
}


let generateNewTxnDoc = async (input) => {
    try {
        let data = await getDetails(input)
        let newId = await getNewTxnId();

        let newDoc1 = {
            "_id": newId,
            "wbuser": input.wbuser,
            "subId": input.subID,
            "price": {
                "amount": data['wbDets']['pricing']['price'],
                "currency": data['wbDets']['pricing']['currency']
            },
            "pubId": data['wbDets']['_id'],
            "date": utils.getCurrentDateInUTC(),
            "status": "initiated",
            "gateway": input.gateway,
            "details": {},
            //  "orderId": gateways[input.gateway]({ txn: newId, wbuser: input.wbuser, subID: input.subID })
        }
        await txnDb.insert(newDoc1)
        return newId
    } catch (error) {
        throw error
    }
}

let updateTxnDoc = async (id, updates) => {

}

let getNewTxnId = async () => {
    try {
        let maxCount = await txnDb.view('byAdmin', 'getAvailableId');
        if (maxCount) {
            let newId = maxCount.rows[0].value + 1;
            let newId5 = "0000".concat(newId.toString(36)).slice(-5)
            // console.log("New txn  id = " + newId5)
            return newId5
        } else {
            throw generateError('', '')
        }
    } catch (error) {
        throw error
    }
}
module.exports.getNewTxnId = getNewTxnId;

// redirecting to payment gateway page
module.exports.paymentGateway = async (req, res, next) => {
    try {
        //console.log(req.body)
        let input = {
            subID: req.body['subId'],
            wbuser: req.body['wbuser'],
            auth: req.body['auth'],
            mode: req.body['mode'],
            gateway: req.body['gateway'],
            retry: req.body['retry'] // whether retrying again or not 
        }
        let data = await getDetails(input)
        // console.log(data)
        //console.log(data)
        if (input['mode'] == 'free') {
            data['redirect'] = false;
            let res = await renewFreeSubscription(input)
            // console.log(res)
            data['status'] = res
        } else {
            data['redirect'] = true;

            if(input['retry'] == 'no'){
                // generate a new transaction document 
                let newTxnId = await generateNewTxnDoc(input);
                input['txnDocId'] = newTxnId;
            }else if(input['retry'] == 'yes'){
                // get old txn id
                input['txnDocId'] = data['failedTxn']['data']['id'];

                console.log("using old id"+input['txnDocId'] )
            }

            let ipt = JSON.parse(JSON.stringify(data))
                ipt['input'] = input
                data['gwForm'] = await gateways[input.gateway]['redirect'](ipt);

            // if (input['retry'] == 'yes') {
            //     // fetch failed id, generate new order id

            // } else if (input['retry'] == 'no') {
            //     // generate new doc, generate new order 
            // }
            await updateTxnStep(input['txnDocId'], 'redirectingToGateway', {})
        }
        let page = await toHTML('payment/redirectPage.ejs', data)
        res.send(page)
    } catch (error) {
        console.log(error)
    }
}



let proSubscription = async (input) => {
    try {
        let txnDoc = await txnDb.get(input);
        //console.log(txnDoc)

        let subDoc = await utils.checkSubscriptionValidityObj(txnDoc.wbuser, txnDoc.subId)
        delete subDoc['validity'] // this is added by the function in the obj recieved from db 
        //console.log(subDoc)

        let pubDets = await wbdets.getWBDetails(subDoc['wbId'], subDoc['curSubr']['pubId'])  // wbid, pubId
        //console.log(pubDets['pricing'])

        let newCurrSubr = {
             "date": utils.getCurrentDateInUTC(),
             "pubId": pubDets['_id'],
             "version": pubDets['version'],
             "period": pubDets['pricing']['period'],
             "type": "paid",
             "txn": input
        }
        subDoc['subrHist'].push(JSON.parse(JSON.stringify(subDoc['curSubr'])))
        subDoc['curSubr'] = JSON.parse(JSON.stringify(newCurrSubr));

        await subDb.insert(subDoc)
        await updateTxnStep(input, 'subscriptionUpdated', {})
        return {
            success:true,
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

let getPaymentDetails = async (txnId) =>{
    try {
        let txnDoc = await txnDb.get(txnId);
        let subDoc = await utils.checkSubscriptionValidityObj(txnDoc.wbuser, txnDoc.subId)
        let wbdets1 =  await wbdets.getWBDetails(subDoc['wbId'], subDoc['curSubr']['pubId'])
        let wbHome = await  config.getInner('frontEndUrl','wbpage')
        let supportEmail = await  config.get('supportEmail')

        delete txnDoc['history']
        delete txnDoc['details']
        delete subDoc['subrHist']
        delete wbdets1['category']
        delete wbdets1['sheets']
        delete wbdets1['meta']
        delete wbdets1['pricing']
        delete wbdets1['description']

        let details = {
            'wbuser': txnDoc.wbuser,
            'subId': txnDoc.subId,
            'txn' : txnDoc,
            'sub': subDoc,
            'wbDets':wbdets1,
            'wbHomeUrl':wbHome,
            'supportEmail':supportEmail
        }
        return details
    } catch (error) {
        throw error
    }
}

// getPaymentDetails('00001')
// .then(data=>{
//     console.log(data)
// })

//the call back function 
module.exports.paymentStatus = async (req, res, next) => {
    // console.log(req.body);
    try {
        console.log("in callback, check txn")
        let gtype = req.params['gateway'];
        let input = {
            status: req.body['status'],
            data: req.body.data,
            txnId: req.params['txnId']
        }
        // console.log(input)
        let txnStatus = await gateways[gtype]['process'](input)

        //console.log(txnStatus)
        if (txnStatus.success) {
            // update subscription
            await proSubscription(input['txnId'])
        }
        //  else {
        //     // error handling 
        // }
        // console.log()
        let pdets = await getPaymentDetails(input['txnId']) 
        res.send(await toHTML('/payment/paymentStatus.ejs',pdets))
    } catch (error) {
        console.log(error)
    }

}
