// const config = require('../services/config');
const nano = require('nano')(config.getEnv('dbServer'));
const subDb = nano.db.use('wbsubscriptions');
const wsDb = nano.db.use('worksheets')
const gDb = nano.db.use('global')
const utils = require('../services/utilities');
const wbdets = require('../services/wbDetails');
// library  list


// TODO use util.generateError inside all try blocks .....DO NOT directly use req.error inside try block

let loadSubList = async (wbuser) => {
  try {
    let subscrData = [], wbIds = [];
    let data = await subDb.view('web', 'wbuserToDoc', { key: wbuser });
    for (let index = 0; index < data.rows.length; index++) {
      let subData = JSON.parse(JSON.stringify(data.rows[index].value));
      // console.log(subData)
      let wbValidity = await utils.checkSubscriptionValidityPeriod(subData['date'], subData['period']);
      subData['validity'] = wbValidity.validity;
      subData['endDate'] = wbValidity.endDate;
      subData['daysLeft'] = utils.daysBetween(subData['date'], utils.getCurrentDateInUTC())
      subData['subId'] = data.rows[index].id

      let subs = {
        subscription: {
          validity: wbValidity.validity,
          "type": subData["type"],
          "pubId": subData["pubId"],
          "endDate": wbValidity.endDate,
          "daysLeft": utils.daysBetween(subData['date'], utils.getCurrentDateInUTC()),
          "subId": data.rows[index].id,
          "period": subData["period"]
        }
      }

      let originalwsid = subData['wbId'];
      if (subData.beta) {
        if (subData.beta == true) {
          originalwsid = subData['wbId'].split('_')[0]; //since wsid for beta are of the form - 00000_beta
          subs['subscription']['betaAccess'] = await utils.checkBetaAccessBoolean(wbuser, subData['pubId'])
          subs['subscription']['beta'] = true
        }
      }

      subs['subscription']['wbId'] = originalwsid
      wbIds.push(subData['pubId']);
      subData['originalwsid'] = originalwsid;

      subs['update'] = await wbdets.checkIfUpdateAvailableObject(subData['pubId'])
      subscrData.push(subs)
    }
    // including wb details
    let wbDetails = {};
    let wbData = await wbdets.getWbMetadata(wbIds)
    wbData.map(itm => {
      wbDetails[itm.wbId + "-" + itm.pubId] = JSON.parse(JSON.stringify(itm))
    })
    subscrData.map((itm) => {
      itm.wbDetails = wbDetails[itm.subscription['wbId'] + "-" + itm.subscription["pubId"]]
      delete itm['wbDetails']['publisher']['photoURL']
    })

    return subscrData;

  } catch (error) {
    console.log(error)
    throw error
  }
}

let listofSubscribedWb = async (req, res, next) => {
  try {
    // await utils.inspectJSON(req.body, { validFields: ['wbuser'], requiredFields: ['wbuser'], acceptBlank: false })
    // let rqwbuser = req.params.wbuser;
    let input = {
      wbuser: req.valid_username
    }
    let subscrData = await loadSubList(input.wbuser)
    res.success(subscrData);
  } catch (error) {
    res.error(error)
  }
}
module.exports.listofSubscribedWb = listofSubscribedWb

let detailsofSubscribedWb = async (req, res, next) => {
  try {
    // await utils.inspectJSON(req.body, { requiredFields: ['wbuser'], validFields: ['wbuser'], acceptBlank: false })
    let input = {
      wbuser: req.valid_username, // todo get from token,
      subId: req.params.wbid,
    }
    await utils.inspectJSON(input, { requiredFields: ['wbuser', 'subId'], validFields: ['wbuser', 'subId'] })
    // console.log(input)
    // get subscr record
    let data = await utils.checkSubscriptionValidity(input.wbuser, input.subId)
    let wbId;
    let details = {};
    let isBetaWb = false;
    // let subdata = await utils.checkSubscriptionValidity(rqwbuser, rqwbid)
    // let wbValidity = utils.checkSubscriptionValidityPeriod(data['curSubr']['date'], data['curSubr']['period']);
    // getting the subscription details
    details.subscription = {
      id: data._id,
      pubId: data.curSubr.pubId,
      txn: data.curSubr.txn,
      date: data.curSubr.date,
      period: data.curSubr.period,
      version: data.curSubr.version,
      type: data.curSubr.type,
      validity: data.validity.validity,
      endDate: data.validity.endDate,
      daysLeft: utils.daysBetween(data['curSubr']['date'], utils.getCurrentDateInUTC())
    }
    if (data['beta']) {
      isBetaWb = true;
      wbId = data['wbId'].split('_')[0];
    } else {
      wbId = data['wbId'];
    }
    //getting wb details
    let wbData = await wbdets.getWBDetails(wbId, data.curSubr.pubId)
    // console.log(wbData)
    details.workbook = wbData
    //  console.log(await wbdets.checkIfUpdateAvailableObject(data.curSubr.pubId))
    details['update'] = await wbdets.checkIfUpdateAvailableObject(data.curSubr.pubId)
    // get worksheet details
    let keys = [];
    details.workbook.sheets.map((itm) => {
      if (itm.publish == true) {
        // let key = req.params.wbuser + "///" + wbId + "///" + itm.wsId;
        let key = input.wbuser + "-" + itm.wsId;
        if (isBetaWb) {
          key += "_beta"
        }
        // TODO handle beta worksheets here
        keys.push(key)
      }
    })
    let data1 = await wsDb.view('web', 'wbuserwsidToDetails', { keys: keys })
    // data1 contains list of worksheets generated
    // let checkIfWsGenerated = (id) => {
    //   return data1.rows.find(itm => {
    //    //  console.log(itm)
    //     if (itm.key == id ) {

    //       if(itm.value.hasOwnProperty('generateWorksheet')){
    //         return false;
    //       }else{
    //         return true
    //       }
    //     }
    //   })
    // }
    let checkIfWsGenerated = (id) => {
      return data1.rows.find(itm => {
        if (itm.key == id) {
          return true;
        }
      })
    }
    wsList = [];

    details.workbook.sheets.map(item => {
      // first search for id in
      let ws = {
        title: item.wsTitle,
        description: item.wsDescp,
        mode: item.mode,
        id: item.wsId,
        free: item.free,
        wsGenerated: false,
        duration: item.time
        // TODO - where to get the duration from ? worksheet or workbook 
      };
      //console.log(rqwbuser + '-' + item.wsId)
      let ky = input.wbuser + '-' + item.wsId;
      if (isBetaWb) {
        ky += "_beta"
      }
      let wsExists = checkIfWsGenerated(ky)
      //console.log(wsExists);
      if (wsExists) {
        // console.log(wsExists)
        ws.wsGenerated = true;

        if (wsExists['value'].hasOwnProperty('generateWorksheet')) {
          ws['wsGenerated'] = false;
          ws['inProgress'] = true;
        }

        let isSubmitted = false;
        if (wsExists.value['submittedOn']) {
          isSubmitted = true;
        }

        ws.data = {
          isSubmitted: isSubmitted,
          reuse: wsExists.value.reuse,
          startedOn: wsExists.value.startedOn,
          submittedOn: wsExists.value.submittedOn,
          summary: wsExists.value.summary,
          response: {}
        }

        if (wsExists.value.pubId != data.curSubr.pubId) {
          ws['data']['updateAvailable'] = true;
        } else {
          ws['data']['updateAvailable'] = false;
        }


        ws.data['response']['resume'] = false;
        if (wsExists.value['startedOn']) {
          ws.data['response']['resume'] = true;
          if (wsExists.value['response']['resData'].length > 0) {
            let tt = 0;
            let stats = {
              total: wsExists.value['response']['resData'].length,
              lock: 0,
              review: 0,
              hint: 0,
              expl: 0,
              helpUsed: 0
            }
            wsExists.value['response']['resData'].map(itm => {
              tt += itm['timeTaken'];
              if (itm['lock'] == true) {
                stats['lock']++;
              }
              stats['review'] += itm['review'];

              if (itm['helpUsed'] == 1) {
                stats['hint']++;
              }
              else if (itm['helpUsed'] == 2) {
                stats['hint']++;
                stats['expl']++;
              }
              stats['helpUsed'] += itm['helpUsed']
            })
            ws.data['response']['timeTakenSeconds'] = tt;
            ws.data['response']['stats'] = stats;
          } else {
            ws.data['response']['timeTakenSeconds'] = 0;
          }
          ws.data['response']['mode'] = wsExists.value['response']['mode'];
          ws.data['response']['duration'] = wsExists.value['response']['duration'];
        }
      }
      //console.log(ws)
      wsList.push(ws)
    })
    details.worksheets = JSON.parse(JSON.stringify(wsList));

    delete details.workbook.sheets;
    //console.log(details)
    res.success(details);

  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.detailsofSubscribedWb = detailsofSubscribedWb

let loadWorksheet = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      requiredFields: ['mode', 'duration'],
      validFields: ['mode', 'duration', 'metaOnly', 'play'],
      acceptBlank: false
    })

    let input = {
      wbuser: req.valid_username,
      wsId: req.params.wsid,
      mode: req.body.mode,
      duration: req.body.duration,
      subId: req.params.subid,
      metaOnly: req.body.metaOnly,
      play: req.body.play
    }

    ///check subscription validity
    let subData = await utils.checkSubscriptionValidity(input.wbuser, input.subId);
    //console.log(subData)
    let wskey = input.wbuser + "-" + input.wsId
    if (subData.beta == true) {
      wskey += "_beta"
    }
    // check doc
    let wbDataDb = await wsDb.view('web', 'wbuserwsidToData', { key: wskey });
    if (wbDataDb.rows.length > 0) {
      let wbData = wbDataDb.rows[0].value;

      if (wbData.hasOwnProperty('generateWorksheet')) {
        if (wbData.generateWorksheet == false) {
          res.success({ message: "There was some error in generating this worksheet. Report this at support@examineer.in", generated: false })
        } else {
          res.success({ message: "The worksheet is being generated. Check back after some time", generated: false })
        }
      } else {
        if (wbData.elements) {
          let resp = {
            meta: {},
            quizdata: { elements: [] }, // wbData.elements,
          }

          let mdets = await wbdets.getWorksheetDetails(subData['curSubr']['pubId'], input.wsId) //pubIb, wsId
          resp['meta'] = {
            free: mdets["free"],
            wsTitle: mdets["wsTitle"],
            wshelpAllowed: mdets["wshelpAllowed"],
            publish: mdets["publish"],
            wsDescp: mdets["wsDescp"],
            wsGradingMatrix: mdets["wsGradingMatrix"],
            time: mdets["time"],
            mode: mdets["mode"],
            wsId: mdets["wsId"],
            wsInstr: mdets["wsInstr"],

          }

          if (mdets['helpLevelSelAtReview']) {
            resp['meta']['helpLevelSelAtReview'] = mdets['helpLevelSelAtReview']
          }


          if (wbData.startedOn) {
            // resuming the ws
            if (!resp['quizdata']['response']) {
              resp['quizdata']['response'] = {}
            }
            resp['quizdata']['response']['isSubmitted'] = false;
            resp['quizdata']['response'] = wbData.response;
            // if(wbData['feedback']){
            // resp['quizdata']['feedback'] = wbData['feedback'];
            // }
            resp['quizdata']['response']['resume'] = true
            // check submitted on
          } else {
            // add st on, resp blank,
            // 
            if (input.play == true) {
              // start this ws
              let blankResp = {
                mode: input.mode,
                duration: input.duration,
                lastQue: 0,
                resData: [],
              }
              wbData['response'] = blankResp;
              wbData['startedOn'] = utils.getCurrentDateInUTC();

              //update started on and blank response in db 
              await wsDb.insert(wbData)

              resp['quizdata']['response'] = blankResp;
              resp['quizdata']['response']['resume'] = false
            }
          }

          if (wbData['userdata']) {
            resp['quizdata']['userdata'] = wbData['userdata'];
          }

          if (wbData.submittedOn) {
            resp['quizdata']['response']['isSubmitted'] = true;
            resp['quizdata']['response']['resume'] = false;
            resp['quizdata']['response']['summary'] = wbData.summary
            resp['quizdata']['response']['submittedOn'] = wbData.submittedOn
          }

          // if mode is lesson, also return answers . if quiz is submitted answers are there in the response object
          if (input.mode == "lesson") {
            resp['quizdata']["answers"] = wbData.answers
          }

          if (subData['curSubr']['type'] == 'free') {
            let fh = resp['meta']['free']['hints'], fe = resp['meta']['free']['explanations'];
            for (var i = 0; i < wbData.elements.length; i++) {
              if (i <= resp['meta']['free']['items'] - 1) {
                let a = JSON.parse(JSON.stringify(wbData.elements[i]))
                a['access'] = 0;
                if (resp['meta']['wshelpAllowed'] >= 1) {
                  a['access'] += fh > 0 ? 1 : 0;
                }
                if (resp['meta']['wshelpAllowed'] == 2) {
                  a['access'] += fe > 0 ? 1 : 0;
                }
                fh--;
                fe--;
                // access : -1 : access not allowed , 0: only que allowed, 1 :que + hint alloed, 2 : que + hint + expl 
                resp.quizdata['elements'].push(a)
              } else {
                resp.quizdata['elements'].push({ "type": wbData.elements[i]["type"], "ref": wbData.elements[i]["ref"], access: -1 })
              }
            }
          } else {
            // beta, paid 
            resp.quizdata['elements'] = wbData.elements
            wbData.elements.map(itm => {
              itm.access = true
            })
          }
          //   resp.quizdata['elements'] = wbData.elements

          if (resp['quizdata']['response']) {
            if (resp['quizdata']['response']['resData'].length > 0) {
              resp['quizdata']['response']['isResponse'] = true
            } else {
              resp['quizdata']['response']['isResponse'] = false
            }
          }
          if (input.metaOnly) {
            if (input.metaOnly == true) {
              delete resp['quizdata']
            }
          }
          res.success(resp)
        } else {
          res.success({ message: "Worksheet generation in process. Please try again later.", generated: false })
        }
      }
    } else {
      await wbdets.generateOneWorksheetStub(input.wsId, subData['curSubr']['pubId'], input.wbuser)
      res.success({ message: "Worksheet generation in process. Please try again later.", generated: false })
    }
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.loadWorksheet = loadWorksheet;

let evaluators = {
  'fillIn': (answer, response) => {
    let isCorrect = true;
    let nTrue = 0, partiallyCorrect = false, correctFraction;
    answer.ansKey.forEach(itm => {

      let studentResponse = response[itm.blankName]
      if (itm.blankType == 'text') {
        studentResponse.trim()
        if (itm.values.indexOf(studentResponse) >= 0) {
          isCorrect = isCorrect && true;
          nTrue++
        } else {
          isCorrect = isCorrect && false;
        }
      } else if (itm.blankType == 'number') {
        if (itm.values) {
          if (itm.values.indexOf(studentResponse) >= 0) {
            isCorrect = isCorrect && true;
            nTrue++
          } else {
            isCorrect = isCorrect && false;
          }
        } else if (itm.range) {
          if (itm.range[0] < studentResponse < itm.range[1]) {
            isCorrect = isCorrect && true;
            nTrue++
          } else {
            isCorrect = isCorrect && false;
          }
        }
      }
    })
    if (nTrue != answer.ansKey.length) {
      // answer is partially correct
      partiallyCorrect = true;
      correctFraction = nTrue / answer.ansKey.length // fraction of anwser that is correct 
    }
    return { isCorrect: isCorrect, partial: partiallyCorrect, nTrue: nTrue, correctFraction: correctFraction }
  },
  'mcq': (answer, response) => {
    // console.log(answer.ansKey, response, answer.ansKey == response.answerId)
    let isCorrect = answer.ansKey == response
    return { isCorrect: isCorrect, partial: false }
  },
  'arrange': (answer, response) => {
    //console.log("================")
    // console.log(response)
    //console.log("================")

    let respValues = [];
    response.forEach(itm => {
      respValues.push(answer.ansKey.itemValues[itm])
    })
    // console.log(respValues)

    let isCorrectOrder = (el, index, arr) => {
      if (index === 0) {
        return true;
      } else {
        if (answer.ansKey.order == 'decreasing') {
          return (el <= arr[index - 1]);
        } else if (answer.ansKey.order == 'increasing') {
          return (el >= arr[index - 1]);
        }
      }
    }

    let isCorrect = respValues.every(isCorrectOrder)
    return { isCorrect: isCorrect, partial: false }
  },
  'sub': (answer, response) => {
    return { isCorrect: true, partial: false }
  }
}


let gradeQuestion = (question, answer, response, gmatrix) => {
  // console.log(response)
  let scoreObj;
  let gmCol, gmRow;
  let partial = { partial: false, partialScore:0 };
  if (response.answerId == -1 && response.lock == false) {
    // if answer id is -1 and lock is false , question considered skipped
    gmRow = 1
    gmCol = response['helpUsed'];
  } else {
    if (question != "info") {
      let ev = evaluators[question](answer, response.answerId);
      let isCorrect = ev['isCorrect'];
      // console.log(isCorrect)
      gmRow = isCorrect ? 0 : 2;
      gmCol = response['helpUsed'];

      // if evaluators
      if (ev['partial']) {
        // the answer is partially correct 
        // in this case add a partial field  that contains the score to be added to the score field to account for partial grading 
        let correctScore = gmatrix[0][gmCol];
        let incorrectScore = gmatrix[2][gmCol];
        let partialScoreToAdd = (correctScore - incorrectScore) * ev['correctFraction']

        partial.partial = true;
        partial.partialScore = partialScoreToAdd
      }

    } else {
      gmRow = 1;
      gmCol = 0
    }
  }



  return { partial: partial, score: gmatrix[gmRow][gmCol], gmIndex: [gmRow, gmCol] };
}


let genSummaryFromResp = (scoredResponse, gradMatrix) => {
  let summary = {
    total: 0, // total questions 
    gradable: 0, // total gradable questions , this excludes info type question  //new

    graded: 0, // graded questions , same as gradable
    ungraded: 0, // info content etc
    pending: 0, // question pedning to be graded -- mostly subjective questions  //new

    attempted: 0, // locked 

    skipped: 0, // unlocked
    correct: 0, // locked questions that are correct and graded .i.e. not pending for grading 
    incorrect: 0, // locked questions that are incorrect

    score: 0, // total score
    partialScores: 0, // total partial score  //new
    time: 0, // total time taken in secords 
    help: 0, // no of times help was used 
    max: 0, // max score
  }

  scoredResponse.map(itm => {
    
    if (itm['answerId'] != -1) {
      // that means lock is true
      summary['attempted']++;
    }

    let isPending = false;
    if (itm['type'] == 'sub') {
      // subjective question will be skipped from the total score if
      if (itm.hasOwnProperty("graded")) {
        if (itm['graded']) {
          // the subsjctive question was graded , add scores 
          summary['score'] += itm['score'];
          summary['graded']++
          isPending = false;
        }else{
          // if sub que not yet graded , increment pending count 
          summary['pending'] ++ 
          isPending = true;
        }
      }else{
        summary['pending'] ++
        isPending = true;
      }
    } else {
      // always add score
      summary['score'] += itm['score'];
      if(itm['type']!='info'){
        summary['graded']++;
      }
      isPending = false;
    }

    switch (itm.gmIndex[0]) {
      case 0: if(isPending==false){summary['correct']++}; break;
      case 1: summary['skipped']++; break;
      case 2: summary['incorrect']++; break;
    }

    summary['partialScores'] += itm['partial']
    summary['help'] += itm['helpUsed'];
    summary['time'] += itm['timeTaken'];
  })
  let findTypeQue = scoredResponse.filter(itm => { return itm.type == 'info' });
  summary['total'] = scoredResponse.length;
  summary['ungraded'] = findTypeQue.length;
  // summary['graded'] = summary['total'] - summary['ungraded'];
  summary['gradable'] = summary['total'] - summary['ungraded'];
  
  // console.log(gradMatrix[0][0] * summary['graded'])
  summary['max'] = gradMatrix[0][0] * summary['graded']; //  TODO find max value from grading matrix

  return summary
}


let gradeWS = async (wsData) => {
  let gradMatrix = await wbdets.getWSGradingMatrix(wsData.pubId, wsData.wsId)
  // console.log(gradMatrix)
  let scoredResponse = [];
  wsData.response.resData.map(itm => {
    // console.log(wsData['answers'][itm.ref])
    let score = gradeQuestion(itm.type, wsData['answers'][itm.ref], itm, gradMatrix);
    // console.log(score)
    itm['score'] = score['score'];
    itm['gmIndex'] = score['gmIndex'];
    itm['correctAns'] = wsData['answers'][itm.ref]['correctAns']

    //if (score['partial']['partial']) {
    itm['partial'] = score['partial']['partialScore']
    //}

    scoredResponse.push(itm)
  })
  let summ = genSummaryFromResp(scoredResponse, gradMatrix)
  return { scoredResponse: scoredResponse, summary: summ }
}

let submitAWorksheet = async (req, res, next) => {
  try {
    // await utils.inspectJSON(req.body, {
    //   requiredFields: ['wbuser'],
    //   validFields: ['wbuser'],
    //   acceptBlank: true
    // })

    let input = {
      wbuser: req.valid_username,
      wsId: req.params.wsid,
      subId: req.params.subid
    }
    console.log(input)
    ///check subscription validity
    let subData = await utils.checkSubscriptionValidity(input.wbuser, input.subId);
    // console.log(subData)
    let wskey = input.wbuser + "-" + input.wsId
    if (subData.beta == true) {
      wskey += "_beta"
    }
    // check doc
    let wbDataDb = await wsDb.view('web', 'wbuserwsidToData', { key: wskey });
    if (wbDataDb.rows.length > 0) {
      let wbData = wbDataDb.rows[0].value;
      if (wbData.generateWorksheet == false) {
        res.error({ message: "Ws not generated", generated: false })
      } else {
        if (wbData.elements) {
          if (wbData.startedOn) {
            if (!wbData.submittedOn) {
              wbData['submittedOn'] = utils.getCurrentDateInUTC();
              // console.log(await gradeWS(wbData))
              let scoredResponses = await gradeWS(wbData)
              wbData['response']['resData'] = scoredResponses['scoredResponse']
              wbData['summary'] = scoredResponses['summary']
              // wbData['summary'] = { message: 'some data here later' }
              await wsDb.insert(wbData)
              res.success({ "message": "Submitted", resp: scoredResponses })
            } else {
              res.error({ message: "already sumbitted, reset to start again" })
            }
          } else {
            res.error({ message: "not yet started" })
          }
        } else {
          res.error({ message: "Worksheet generation in process. Please try again later.", generated: false })
        }
      }
    } else {
      res.error({ message: "wb does not exists" })
    }
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.submitAWorksheet = submitAWorksheet;



let checkAnsLesson = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      requiredFields: ['response'],
      validFields: ['response'],
      acceptBlank: true
    })

    let input = {
      wbuser: req.valid_username,
      wsId: req.params.wsid,
      response: req.body.response,
      subId: req.params.subid
    }

    ///check subscription validity
    let subData = await utils.checkSubscriptionValidity(input.wbuser, input.subId);
    // console.log(subData)
    let wskey = input.wbuser + "-" + input.wsId
    if (subData.beta == true) {
      wskey += "_beta"
    }
    // check doc
    let wbDataDb = await wsDb.view('web', 'wbuserwsidToData', { key: wskey });
    if (wbDataDb.rows.length > 0) {
      let wbData = wbDataDb.rows[0].value;
      if (wbData.generateWorksheet == false) {
        res.error({ message: "Ws not generated", generated: false })
      } else {
        if (wbData.elements) {
          if (wbData.startedOn) {
            if (!wbData.submittedOn) {
              //   wbData['submittedOn'] = utils.getCurrentDateInUTC();
              //   console.log(await gradeWS(wbData))
              //   let newResponses = await gradeWS(wbData)
              //  // wbData['summary'] = await gradeWS(wbData)
              //   res.success({ "message": "Submitted" ,resp:newResponses})
              if (wbData.response.mode == 'lesson') {
                let queType = input['response']['type']
                let answ = wbData['answers'][input['response']['ref']]
                let gm = await wbdets.getWSGradingMatrix(wbData.pubId, wbData.wsId)
                let st = gradeQuestion(queType, answ, input['response'], gm)
                st['correctAns'] = answ['correctAns']
                st['isCorrect'] = true;
                if (st['gmIndex'][0] > 0) {
                  st['isCorrect'] = false;
                }
                res.success(st)
              } else {
                res.error({ message: "not allowed. current mode is quiz. answer checking only allowed in lesson mode" })
              }
            } else {
              res.error({ message: "already sumbitted, reset to start again" })
            }
          } else {
            res.error({ message: "not yet started" })
          }
        } else {
          res.error({ message: "Worksheet generation in process. Please try again later.", generated: false })
        }
      }
    } else {
      res.error({ message: "wb does not exists" })
    }
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.checkAnsLesson = checkAnsLesson;


let saveResponse = async (req, res, next) => {
  // first get ws data,
  // check if worksheet is still running
  // save response in response object
  // save document
  try {
    //throw utils.generateError('errorTesting','do not submit')
    await utils.inspectJSON(req.body, {
      validFields: ['respData', 'lastQue', 'updateDuration', 'feedback', 'userdata'],
      acceptBlank: false
    })

    let input = {
      wbuser: req.valid_username,
      wsId: req.params.wsid,
      respData: req.body.respData,
      lastQue: req.body.lastQue,
      subId: req.params.subid,
      updateDuration: req.body.updateDuration,
      feedback: req.body.feedback,
      userdata: req.body.userdata
    }
    ///check subscription validity
    let subData = await utils.checkSubscriptionValidity(input.wbuser, input.subId);
    // console.log(subData)
    let wskey = input.wbuser + "-" + input.wsId
    if (subData.beta == true) {
      wskey += "_beta"
    }
    // check doc
    let wbDataDb = await wsDb.view('web', 'wbuserwsidToData', { key: wskey });
    //console.log(wbDataDb)
    if (wbDataDb.rows.length > 0) {
      let wbData = wbDataDb.rows[0].value;
      if (wbData.generateWorksheet == false) {
        res.error({ message: "Ws not generated", generated: false })
      } else {
        if (wbData.elements) {

          if (wbData.startedOn) {
            // TODO check : quiz must not be sumbitted

            if (!wbData.submittedOn) {
              // if ws is submitted only feed back can be saved 

              wbData['response']['resData'] = input.respData;
              if (input.lastQue) {
                wbData['response']['lastQue'] = input.lastQue;
              }

              if (input.updateDuration) {
                // duration for the lesson can be extended
                // check if the mode if lesson , only then allowed
                if (wbData['response']['mode'] == 'lesson') {
                  wbData['response']['duration'] = input.updateDuration
                } else {
                  return res.error({ message: "not allowed to extend duration of a quiz" })
                }
              }
            }


            if (input.feedback) {
              wbData['feedback'] = input.feedback
            }

            if (input.userdata) {
              wbData['userdata'] = input.userdata
            }

            await wsDb.insert(wbData)

            //resp.quizdata['elements'] = wbData.elements
            res.success({ "message": "Response saved" })
          } else {
            res.error({ message: "not yet started" })
          }

        } else {
          res.error({ message: "Worksheet generation is in process. Please try again later.", generated: false })
        }
      }
    } else {
      res.error({ message: "wb does not exists" })
    }
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.saveResponse = saveResponse;

let resetWorksheet = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      validFields: ['update'],
      acceptBlank: false
    })

    let rqwbuser = req.params.wbuser;
    let rqwsid = req.params.wsid;
    // req to math server
    let input = {
      wbuser: req.valid_username,
      wsId: req.params.wsid,
      subId: req.params.subid,
      updateToLatest: req.body.update
    }
    ///check subscription validity
    let subData = await utils.checkSubscriptionValidity(input.wbuser, input.subId);
    let maxResetCount = await config.getInner("maxResetCount", subData['curSubr']['type'])
    let wskey = input.wbuser + "-" + input.wsId
    if (subData.beta == true) {
      wskey += "_beta"
    }
    // check doc
    let wbDataDb = await wsDb.view('web', 'wbuserwsidToData', { key: wskey });
    if (wbDataDb.rows.length > 0) {
      let wbData = wbDataDb.rows[0].value;
      if (wbData.generateWorksheet == false) {
        throw utils.generateError('notAllowed', 'Ws not generated')
      } else {
        if (wbData.elements) {
          if (wbData.generateWorksheet == true) {
            res.success({ "message": "Resetting worksheet. Worksheet generation in process. Check back later" })
          } else {
            let updateToNewVer = false;
            if (subData['curSubr']['pubId'] != wbData.pubId) {
              updateToNewVer = true
            }
            if (updateToNewVer) {
              wbData['generateWorksheet'] = true;
              delete wbData['response'];
              delete wbData['startedOn'];
              delete wbData['submittedOn'];
              delete wbData['summary'];
              // wbData['reuse'] = 0
              if (input.updateToLatest == true) {
                wbData['pubId'] = subData['curSubr']['pubId'];
                wbData['reuse'] = 0
              }
              wbData['createdOn'] = utils.getCurrentDateInUTC()
              await wsDb.insert(wbData)
              res.success({ "message": "Resetting worksheet. Worksheet generation in process. Check back later" })
            } else {
              wbData['reuse']++
              if (wbData.reuse <= maxResetCount) {
                wbData['generateWorksheet'] = true;
                delete wbData['response'];
                delete wbData['startedOn'];
                delete wbData['submittedOn'];
                delete wbData['summary'];
                wbData['createdOn'] = utils.getCurrentDateInUTC()
                await wsDb.insert(wbData)
                //resp.quizdata['elements'] = wbData.elements
                res.success({ "message": "Resetting worksheet. Worksheet generation in process. Check back later" })
              } else {
                throw utils.generateError('notAllowed', 'Not allowed , reuse count reached')
                // res.error({ "message": "not allowed , reuse count reached" })
              }
            }
          }
        } else {
          throw utils.generateError('notAllowed', 'Worksheet generation in process. Please try again later.')
          //res.error({ message: "Worksheet generation in process. Please try again later.", generated: false })
        }
      }
    } else {
      res.error({ message: "wb does not exists" })
    }
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.resetWorksheet = resetWorksheet;

let updateSubscription = async (req, res, next) => {
  try {
    let input = {
      wbuser: req.valid_username,
      subId: req.params.wbid
    }
    //console.log(input)
    let subData = await utils.checkSubscriptionValidityObj(input.wbuser, input.subId);

    let updateAvailable = await wbdets.checkIfUpdateAvailableObject(subData['curSubr']['pubId'])

    if (updateAvailable.available) {
      // check if beta allowed   
      if (subData.beta) {
        let betaAllowed = await wbdets.checkBetaAccessObj(input.wbuser, updateAvailable.latestpubId);
        if (betaAllowed == false) {
          throw utils.generateError('unauthAccess', "You do not have access to this version. Ask the publisher to provide you beta access.")
          // res.error({ message: "You do not have access to this version. Ask the publisher to provide you beta access." })
        }
      }
      let subDoc = await subDb.get(subData._id);
      let pubDB = await wbdets.getWbMetadata([updateAvailable['latestpubId']])
      let pubDets = pubDB[0]
      let newCurrSubr = {
        "date": utils.getCurrentDateInUTC(),
        "pubId": pubDets['pubId'],
        "version": pubDets['ver'],
        "period": pubDets['pricing']['period'],
        "type": subData['curSubr']['type'],
        "txn": subData['curSubr']['txn']
      }
      if (subData.beta) {
        newCurrSubr['period'] = 30   // get this from config 
      }
      subDoc['subrHist'].push(JSON.parse(JSON.stringify(subDoc['curSubr'])))
      subDoc['curSubr'] = JSON.parse(JSON.stringify(newCurrSubr));
      await subDb.insert(subDoc);
      res.success({ "message": "Workbook updated to v" + newCurrSubr['version'] })
    } else {
      res.success({ message: "No update available at the moment" })
    }
  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.updateSubscription = updateSubscription

let getLangaugeJSON = async () => {
  let langDoc = await gDb.get('workbook_languages')
  //  console.log(langDoc)
  delete langDoc['_id'];
  delete langDoc['_rev'];
  return langDoc
}

let wbmetadata = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, {
      validFields: ['fields'],
      acceptBlank: false
    })

    let input = {
      fields: req.body.fields
    }
    let output = {}
    for (let i = 0; i < input.fields.length; i++) {
      let field = input.fields[i];
      switch (field) {
        case "language":
          let lang = await getLangaugeJSON()
          output['langauge'] = JSON.parse(JSON.stringify(lang))
          break;

        case "inactivityTime":
          output['inactivityTime'] = await config.get('inactivityTime')
          break;
        default:
          break;
      }
    }
    //console.log(output)
    res.success(output)
  } catch (error) {
    console.log(error)
    res.error(error)
  }

}
module.exports.wbmetadata = wbmetadata;

let subGrade = async (req, res) => {
  //sub exist
  //ws submitted
  //ref exist
  try {
    //Data validation
    await utils.inspectJSON(req.body, {
      validFields: ['grade'],
      requiredFields: ['grade'],
      acceptBlank: false
    });
    let input = {
      grade: req.body.grade,
      wsId: req.params.wsId,
      subId: req.params.subId,
      refId: req.params.refId,
      wbuser: req.valid_username
    }

    if (isNaN(input.grade)) {
      throw utils.generateError('invalidGrade', 'Grade must be  number')
    }

    //Chk subcription
    let subData = await utils.checkSubscriptionValidity(input.wbuser, input.subId);
    
    let wskey = input.wbuser + "-" + input.wsId
    if (subData.beta == true) {
      wskey += "_beta"
    }
    // check doc
    let wsDataDb = await wsDb.view('web', 'wbuserwsidToData', { key: wskey });
    if (wsDataDb.rows.length > 0) {
      let wsData = wsDataDb.rows[0].value;
      if (wsData['submittedOn']) {
        // 
        let refIdx = wsData['response']['resData'].findIndex(itm => itm['ref'] == input.refId)
        console.log(refIdx)
        if (refIdx != -1) {
          if (wsData['response']['resData'][refIdx]['type'] == "sub") {
            // 
            let a = wsData['response']['resData'][refIdx];
            if (!a['graded']) {

              if (wsData['response']['resData'][refIdx]['score'] < parseFloat(input.grade)) {
                throw utils.generateError('invalidGrade', 'Grade value provided is invalid')
              }

              wsData['response']['resData'][refIdx]['score'] = parseFloat(input.grade);
              wsData['response']['resData'][refIdx]['graded'] = true;
              wsData['response']['resData'][refIdx]['gradedDate'] = utils.getCurrentDateInUTC();

              let gradMatrix = await wbdets.getWSGradingMatrix(subData['curSubr']['pubId'],input.wsId)
              let newSummary = genSummaryFromResp(wsData['response']['resData'],gradMatrix)
              wsData['summary'] = newSummary
              await wsDb.insert(wsData)
              res.success({ msg: "Graded" })
            } else {
              throw utils.generateError('alreadyGraded', ' Question already graded')
            }
          } else {
            throw utils.generateError('notFound', 'Invalid Question type')
          }
        } else {
          throw utils.generateError('notFound', 'Question not found')

        }
      } else {
        throw utils.generateError('notSubmitted', 'Worksheet not yet submitted')
      }
    } else {
      throw utils.generateError('notFound', 'Worksheet not found')
    }

  } catch (error) {
    res.error(error);
  }
}
module.exports.subGrade = subGrade;

// let checkQuestion = async (req, res, next) => {
//   let input = {
//     queRef: req.params.queRef,
//     subId : req.params.subid,
//     response : req.body.response
//   }
//   res.success({})
// }
// module.exports.checkQuestion = checkQuestion