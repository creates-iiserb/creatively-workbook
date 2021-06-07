// const config = require('../services/config');
const nano = require('nano')(config.getEnv('dbServer'));
const wbDb = nano.db.use('workbooks');
const subDb = nano.db.use('wbsubscriptions');
const wsDb = nano.db.use('worksheets')
const utils = require('../services/utilities');
const wbDetails = require('../services/wbDetails');
const wbDets = require('../services/wbDetails');

//done
let publicWorkbookList = async (req, res, next) => {
  try {
    let body = await wbDets.publicWorkbookList();
    res.success(body)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.publicWorkbookList = publicWorkbookList;

// done
let publicWorkbookDetails = async (req, res, next) => {
  try {
    let rqwbid = req.params.wbid;
    if (!rqwbid) {
      throw utils.generateError('missingField', 'Provide a worksheet id')
    }
    let data = await wbDetails.getLatestWBDetails(rqwbid)
    res.success(data)
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.publicWorkbookDetails = publicWorkbookDetails;

// done
let listBetaWorkbook = async (req, res, next) => {
  try {
    let input = {
      wbuser : req.valid_username
    }
    let betaData = await wbDetails.loadWorkBookStoreBeta(input.wbuser);
    if (betaData['isBetaUser'] == true) {
      res.success(betaData)
    } else {
      throw utils.generateError('notFound', 'You are not a beta tester in any workbook')
    }
  } catch (error) {
    res.error(error)
  }
}
module.exports.listBetaWorkbook = listBetaWorkbook;


// done
let publicWorkbookDetailsBeta = async (req, res, next) => {
  try {
    // todo: get this from token
    let input = {
      wbuser : req.valid_username,
      wbid: req.params.wbid,
      pubid: req.params.pubid
    }
    let data = await wbDetails.getPublicDetailsBeta(input.wbuser, input.wbid, input.pubid)
    res.success(data)

  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.publicWorkbookDetailsBeta = publicWorkbookDetailsBeta;

//done
let generateWorksheetStubs = async (wbid, pubId, wbuser) => {
  // get worksheet info 
  try {
    //let a = await generateOneWorksheetStub('00001-ABC', 'sjain@iiserb.ac.in')
    let wbDetails1 = await wbDetails.getWBDetails(wbid, pubId);   //  wbDetails.get await wbDb.get(wbid)
    //  console.log(wbDetails1)
    let resp = []
    for (let index = 0; index < Math.min(wbDetails1['sheets'].length,await config.get('wbGenCount')); index++) {
      let item = wbDetails1['sheets'][index]
      //console.log(index)
      //console.log(item)
      let respi = await wbDetails.generateOneWorksheetStub(item['wsId'], pubId, wbuser)
      resp.push(respi)
    }
    console.log(resp)
  } catch (error) {
    console.log(error)
    if (error.statusCode == 404) {
      throw utils.generateError('notFound', 'Workbook does not exists');
    } else {
      throw error
    }
  }
}

// done
let getWb = async (req, res, next) => {
  // to get new workbook
  // including beta workbooks
  try {
    await utils.inspectJSON(req.body, {
      validFields: ['beta', 'pubId'],
      allowBlank: false
    })
    let input = {
      wbuser:  req.valid_username,  //req.body.wbuser,
      wbid: req.params.wbid,
      rqbeta: req.body.beta
    };
    let resp;
    // todo combine both functions
    let newResp;
    // console.log(input)
    if (input.rqbeta) {
      input['pubId'] = req.body.pubId
      newResp = await addNewBetaSubscription(input)
      resp = { message: "Subscribed as beta tester successfully", subrid: newResp.subrid }
    } else {
      newResp = await addNewSubscription(input)
      resp = { message: "Subscribed successfully", subrid: newResp.subrid }
    }
    await generateWorksheetStubs(input.wbid, newResp.pubId, input.wbuser)
    res.success(resp)
  } catch (error) {
    res.error(error);
  }
}
module.exports.getWb = getWb;

//done
let addNewSubscription = async (input) => {
  // input - wbuser, wbid // to get a new workbook 
  try {
    // todo inspectjson input
    let status = await utils.checkSubscriptionExists(input)
    if (status.exists) {
      throw utils.generateError('recordExists', 'You already have this workbook in your library. Subscription Id -' + status.subrId)
    } else {
      let userData = await utils.checkUserExists(input.wbuser)
      if (userData.exists) {
        let wbData = await wbDetails.getLatestWBDetails(input.wbid)    // utils.getWbDetails(input.wbid);
        // console.log(wbData)
        if (wbData) {
          // console.log(wbData)
          //  get new wbsubscription id
          let newSubsrId = await getNewSubscriptionId();
          let newSubsr = {
            _id: newSubsrId,
            wbuser: input.wbuser,
            wbId: input.wbid,
            subrHist: [],
            stars: 0,
            curSubr: {
              date: utils.getCurrentDateInUTC(),
              version: wbData.latestVer,
              period: wbData.pricing.period,
              pubId: wbData.pubId,
              type: "free",
              txn: "free"
            }
          };
          // console.log(newSubsr)
          await subDb.insert(newSubsr)
          return { subrId: newSubsrId, pubId: wbData.pubId }
        }
      } else {
        throw utils.generateError('user404', 'User not found')
      }
    }
  } catch (error) {
    throw error
  }
}

//done
let getNewSubscriptionId = async () => {
  try {
    let maxCount = await subDb.view('web', 'getAvailableId');
    if (maxCount) {
      let newId = maxCount.rows[0].value + 1;
      let newId5 = "0000".concat(newId.toString(36)).slice(-5)
      //console.log("New subscriber id = " + newId5)
      return newId5
    } else {
      throw utils.generateError('', '')
    }
  } catch (error) {
    throw error
  }

}

// done
let addNewBetaSubscription = async (input) => {
  // input - wbuser, wbid
  try {
    // check if subscription allowed
    // check if subscription already exists
    await utils.inspectJSON(input, { requiredFields: ['wbid', 'wbuser', 'pubId'], validFields: ['wbid', 'wbuser', 'pubId','rqbeta'] })
    let newSubrId = '';
    let wbid_beta = input.wbid + "_beta";
    let status = await utils.checkSubscriptionExists({ wbuser: input.wbuser, wbid: wbid_beta })
    if (status.exists) {
      throw utils.generateError('recordExists', 'You are already a beta user for this workbook.You can upgrade if new version is available')
    } else {
      let userData = await utils.checkUserExists(input.wbuser)
      if (userData.exists) {
        // let betadetails = await wbDetails.getPublicDetailsBeta(input.wbuser,input.wbid,input.pubId)
        let wbData = await wbDetails.getPublicDetailsBeta(input.wbuser, input.wbid, input.pubId)
        //await utils.getWbDetails(input.wbid);
        if (wbData) {
          let newSubsrId = await getNewSubscriptionId();
          let newSubsr = {
            _id: newSubsrId,
            wbuser: input.wbuser,
            wbId: wbid_beta,
            subrHist: [],
            stars: 0,
            curSubr: {
              date: utils.getCurrentDateInUTC(),
              pubId: input.pubId,
              version: wbData.latestVer,
              period: 30,
              type: "beta",txn: "free"
            },
            beta: true
          };
          await subDb.insert(newSubsr)
          return { subrid: newSubsrId, pubId: input['pubId'] }
        }
      } else {
        throw utils.generateError('user404', 'User not found')
      }
    }
  } catch (error) {
    throw error
  }
}
module.exports.addNewBetaSubscription = addNewBetaSubscription;







// will be redirected from the payment gateway
let subscribeOrRenewWb = async (req, res, next) => {
  // to subscribe/renew a workbook
  try {
    await utils.inspectJSON(req.body, { requiredFields: ['wbuser'], validFields: ['wbuser'], acceptBlank: false })
    let input = { wbuser: req.body.wbuser, wbid: req.params.wbid, txn: req.body.txn };
    let result = await updateSubscription(input)
    res.success({ message: "Subscription updated", details: result })
  } catch (error) {
    res.error(err)
  }
}
module.exports.subscribeOrRenewWb = subscribeOrRenewWb;

let updateSubscription = async (input) => {
  try {
    let wbDetails;
    let selectedSubrId = '0'
    let exists = await checkSubscriptionExists(input);
    if (exists.exists) {
      selectedSubrId = exists.subrId
      await checkTransactionDetails(input)
      wbData = await utils.getWbDetails(input.wbid)
      if (wbData) {
        wbDetails = wbData
        let subscData = await subDb.get(selectedSubrId)
        let updateRequired = false;
        let subsrValidity = await utils.checkSubscriptionValidityPeriod(subscData.curSubr.date, subscData.curSubr.period);
        // 3.3
        // console.log(subsrValidity)
        let cuSubsr = subscData.curSubr;
        subscData.subrHist.push(cuSubsr);
        if (subsrValidity.validity) {
          if (subscData.curSubr.type == 'free') {
            // 3.3.1
            if (input.txn != "free") {
              // free - paid
              subscData.curSubr = {
                txn: input.txn,
                type: 'paid',
                date: utils.getCurrentDateInUTC(),
                version: wbDetails.version,
                period: wbDetails.period
              };
              updateRequired = true;
            } else {
              // free - free
              throw utils.generateError('notAllowed', 'Renewal of free subscription is allowed only after the current free subscription period is over.')

            }
          } else if (subscData.curSubr.type == 'paid') {
            // 3.3.2 
            if (input.txn == "free") {
              // paid - free
              throw utils.generateError('notAllowed', 'Downgrading to free subscription is allowed only after the subscription period is over.')
            } else {
              // paid - paid
              if (subsrValidity.preMatureRenewalAllowed) {
                subscData.curSubr = {
                  txn: input.txn,
                  type: 'paid',
                  date: utils.getCurrentDateInUTC(),
                  version: wbDetails.version,
                  period: wbDetails.period + subsrValidity.daysToAddToNewPeriod
                }
                updateRequired = true;
              } else {
                throw utils.generateError('notAllowed', 'Your paid subscription validity is not yet over. You have also not reached the premature renewal date. ')
              }
            }
          }
        } else {
          // 3.4
          let newRenewalType = 'free';
          if (input.txn != 'free') {
            newRenewalType = 'paid'
          }
          subscData.curSubr = {
            txn: input.txn,
            type: newRenewalType,
            date: utils.getCurrentDateInUTC(),
            version: wbDetails.version,
            period: wbDetails.period
          }
          updateRequired = true;
        }

        if (updateRequired) {
          await subDb.insert(subscData)
        }
      }
    } else {
      throw utils.generateError('notFound', 'Subscription does not exists')
    }
  } catch (error) {
    throw error
  }
}

let checkTransactionDetails = (input) => {
  return new Promise((resolve, reject) => {
    // TODO implement later
    if (input.txn == 'free') {
      resolve()
    } else {
      resolve()
    }

  });
}