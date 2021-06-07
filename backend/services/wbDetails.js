// use this service to fetch detials of workbook instead of making direct databse requests
// const config = require('./config');
const nano = require('nano')(config.getEnv('dbServer'));
const wbDb = nano.db.use('wbpublished');
const util = require("./utilities");
const wsDb = nano.db.use('worksheets');
const foDb = nano.db.use('wbforum');

// to get wb ratings  (add publications included) 
let getWbRatings = async (wbId) => {
    // web/_view/wbIdToRatingDoc
    try {
        let wsDoc = await foDb.view('web', 'wbIdToRatingDoc', { key: wbId });
        if (wsDoc.rows.length > 0) {
            let value = wsDoc.rows[0].value['entries'];
            let ratingsData = await util.generateRatingDoc(value)
            return ratingsData
        } else {
            return false
        }
    } catch (error) {
        throw error
    }
}
module.exports.getWbRatings = getWbRatings

let publicWorkbookList = async () => {
    try {
        let data = await wbDb.view('web', 'latestPublishedWb', { reduce: true, group: true })
        let keys = [];
        data.rows.map(itm => { keys.push(itm.value.pubId) })
        let details = await getWbMetadata(keys)
        return details;
    } catch (error) {
        throw error
    }
}
module.exports.publicWorkbookList = publicWorkbookList;

let getWBDetails = async (wbid, pubId) => {
    try {
        let data = await wbDb.view('web', 'publishedWbDetails', { key: wbid + "-" + pubId })
        if (data.rows.length > 0) {
            if (data.rows[0].value.published) {
                let obj = data.rows[0].value;
                delete obj['logo']
                obj['img'] = await config.get('wbImage') + obj['_id'];

                // ratings
                obj['rating'] = await getWbRatings(wbid)
                return obj
            } else if (data.rows[0].value.isBeta) {
                let obj = data.rows[0].value;
                delete obj['logo']
                obj['img'] = await config.get('wbImage') + obj['_id'];

                return obj
            } else {
                throw util.generateError('wbDisabled', data.rows[0].value['reason'] || 'Blocked due to some reason.Check back later')
            }
        } else {
            throw util.generateError("notFound", "Workbook does not exists")
        }
    } catch (error) {
        throw error
    }
}
module.exports.getWBDetails = getWBDetails;

let genPubDetails = (doc) => {
    var data = {
        wbId: doc.wbId,
        pubId: doc._id,
        category: doc.category,
        description: doc.description,
        title: doc.title,
        pricing: doc.pricing,
        publisher: doc.publisher,
        latestVer: doc.version,
        ifNotPublished: doc.ifNotPublished,
        meta: doc.meta,
        rating:doc['rating']
    }
    if (doc.published) {
        data['published'] = doc.published
    } else if (doc.isBeta) {
        data['published'] = doc.isBeta
        data['beta'] = doc.isBeta
        data["betaId"] = doc.wbId + "_beta"
    }
    if (doc['meta']) {
        data['meta'] = doc['meta']
    }
    var ws = doc.sheets;
    var wsData = []
    for (var i = 0; i < ws.length; i++) {
        if (ws[i].publish) {
            wsData.push({ title: ws[i].wsTitle, descr: ws[i].wsDescp, tags: ws[i].tags, free: ws[i].free, mode: ws[i].mode, time: ws[i].time })
        }
    }
    data.worksheets = wsData
    if (data.published) {
        return data
    } else {
        return { published: false, ifNotPublished: doc.ifNotPublished }
    }
}

let genPubMeta = (doc) => {
    var data = {
        wbId: doc.wbId,
        pubId: doc.pubId,
        title: doc.title,
        publisher: doc.pub,
        ifNotPublished: doc.ifNotPublished,
        ver: doc.ver,
        pricing: doc.pricing,
    }
    if (doc.published) {
        data['published'] = doc.published
    } else if (doc.beta) {
        data['published'] = doc.beta
        data['beta'] = doc.beta
    }
    return data
}

let getLatestWBDetails = async (wbid) => {
    try {
        let data1 = await wbDb.view('web', 'latestPublishedWb', { reduce: true, key: wbid, group: true });
        let pubid;
        if (data1.rows.length > 0) {
            pubid = data1.rows[0].value['pubId'];
            let wbData = await getWBDetails(wbid, pubid);
            let data = genPubDetails(wbData)
            return data
        } else {
            throw util.generateError("notFound", "Workbook does not exists")
        }
    } catch (error) {
        throw error
    }
}
module.exports.getLatestWBDetails = getLatestWBDetails;


let getLatestWBDetailsBeta = async (wbid) => {
    try {
        let data1 = await wbDb.view('web', 'latestBetaVersion', { reduce: true, key: wbid, group: true });
        let pubid;
        if (data1.rows.length > 0) {
            pubid = data1.rows[0].value['pubId']
        } else {
            throw util.generateError("notFound", "Workbook does not exists")
        }
        let wbData = await getWBDetails(wbid, pubid);
        let data = genPubDetails(wbData)
        return data
    } catch (error) {
        throw error
    }
}
module.exports.getLatestWBDetails = getLatestWBDetails;


let reduceToLatest = (list) => {
    let newList = [];
    // sorting list of publications  in the increasing order of pubId, pubId converted from base 36 to 10
    let list1 = list.sort(function (a, b) { return parseInt(b['pubId'], 36) - parseInt(a['pubId'], 36) });
    for (var i = 0; i < list1.length; i++) {
        let searchwbid = list1[i]['wbId'];
        let findWb = (item) => {
            return item.wbId == searchwbid
        }
        let searchforws = newList.findIndex(findWb)
        if (searchforws > -1) {
            if (!newList[searchforws]['otherVersions']) {
                newList[searchforws]['otherVersions'] = []
            }
            newList[searchforws]['otherVersions'].push({ "pubId": list1[i]['pubId'], "version": list1[i]['ver'] })
        } else {
            newList.push(list1[i])
        }
    }
    return newList
}

let loadWorkBookStoreBeta = async (wbuser) => {
    // in the beta store, only the latest version of beta workbook will be displayed 
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });    // TODO 
        let beta = {};
        if (data.rows.length > 0) {
            beta['isBetaUser'] = true;
            let keys = [];
            data.rows.forEach(itm => { keys.push(itm['value']['wbId'] + "-" + itm['value']['pubId']) })
            let wbdetails = []
            data.rows.map(itm => {
                let obj = JSON.parse(JSON.stringify(itm.value));
                obj['betaId'] = itm['value']['wbId'] + "_beta";
                wbdetails.push(obj)
            })
            // console.log(wbdetails)
            beta['list'] = reduceToLatest(wbdetails)
        } else {
            beta['isBetaUser'] = false;
        }
        return beta;
    } catch (error) {
        throw error
    }
}
module.exports.loadWorkBookStoreBeta = loadWorkBookStoreBeta;

let getPublicDetailsBeta = async (wbuser, wbid, pubId) => {
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });
        if (data.rows.length > 0) {
            let findPub = (itm) => { return (itm['value']['wbId'] == wbid && itm['value']['pubId'] == pubId) }
            let a = data.rows.filter(findPub);
            if (a.length > 0) {
                let wbDetails = await getWBDetails(a[0]['value'].wbId, a[0]['value'].pubId);
                return genPubDetails(wbDetails)
            } else {
                // TODO change message later 
                throw util.generateError("notFound", "Not allowed to subscribe as beta. Ask the author to add you as a beta user in this workbook")
            }
        } else {
            throw util.generateError("notFound", "Worksheet does not exists")
        }
    } catch (error) {
        throw error
    }
}
module.exports.getPublicDetailsBeta = getPublicDetailsBeta;

let checkBetaAccess = async (wbuser, pubId) => {
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });
        if (data.rows.length > 0) {
            let findPub = (itm) => { return (itm['value']['pubId'] == pubId) }
            let a = data.rows.filter(findPub);
            if (a.length > 0) {
                return true
            } else {
                throw util.generateError("notFound", "You are no longer a beta tester in the workbook")
            }
        } else {
            throw util.generateError("notFound", "You are not a beta user.")
        }
    } catch (error) {
        throw error
    }
}
module.exports.checkBetaAccess = checkBetaAccess;

let checkBetaAccessObj = async (wbuser, pubId) => {
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });
        if (data.rows.length > 0) {
            let findPub = (itm) => { return (itm['value']['pubId'] == pubId) }
            let a = data.rows.filter(findPub);
            if (a.length > 0) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    } catch (error) {
        throw error
    }
}
module.exports.checkBetaAccessObj = checkBetaAccessObj;

let checkBetaAccessFlag = async (wbuser) => {
    try {
        let data = await wbDb.view("web", "betaUsersList", { key: wbuser });
        if (data.rows.length > 0) {
            return true
        } else {
            return false
        }
    } catch (error) {
        throw error
    }
}
module.exports.checkBetaAccessFlag = checkBetaAccessFlag;


let getWbMetadata = async (pubids) => {
    // wbids must be an array
    try {
        let data = await wbDb.view('web', 'pubIdToMeta', { keys: pubids })
        let results = [];
        let wbids = []
        data.rows.map(itm => {wbids.push(itm['value']['wbId'])})
        let wsDoc = await foDb.view('web', 'wbIdToRatingDoc', { keys: wbids });
        data.rows.map(itm => {
            let det = genPubMeta(itm.value);
            let ratEntries = wsDoc['rows'].findIndex(item =>{return item['key']==itm['value']['wbId']})
            if(ratEntries > -1){
                det['ratings'] = util.generateRatingDoc(wsDoc['rows'][ratEntries]['value']['entries'])
            }
            results.push(det)
        })
        return results;
    } catch (error) {
        throw error
    }
}
module.exports.getWbMetadata = getWbMetadata;

// TODO combine there

let checkIfUpdateAvailable = async (pubId) => {
    try {
        let currPub = await wbDb.get(pubId);
        let currentPubID = currPub['pubId'];
        let wbId = currPub['wbId'];
        let latVer;
        if (currPub.isBeta) {
            latVer = await getLatestWBDetailsBeta(wbId)
        } else {
            latVer = await getLatestWBDetails(wbId)
        }
        let latestAvailable = false;
        let updateRequired = false;
        // if(parseFloat(latVer['version'])==parseFloat(currentVersion)){
        // }else 
        if (parseInt(latVer['pubId'], 36) > parseInt(currentPubID, 36)) {
            latestAvailable = true;
        }
        if (latestAvailable) {
            if (latVer['meta']['updateRequired']) {
                if (latVer['meta']['updateRequired'] == true) {
                    updateRequired = true;
                }
            }
        }
        return {
            available: latestAvailable,
            version: latVer['version'],
            latestpubId: latVer['pubId'],
            required: updateRequired
        }

    } catch (error) {
        throw error
    }
}
module.exports.checkIfUpdateAvailable = checkIfUpdateAvailable;


let checkIfUpdateAvailableObject = async (pubId) => {
    try {
        let currPub = await wbDb.get(pubId);
        let wbId = currPub['wbId'];
        let latVer;
        if (currPub.isBeta) {
            latVer = await getLatestWBDetailsBeta(wbId)
        } else {
            latVer = await getLatestWBDetails(wbId)
        }
        let latestAvailable = false;
        let updateRequired = false;

        if (parseInt(latVer['pubId'], 36) > parseInt(pubId, 36)) {
            latestAvailable = true;
        }


        if (latestAvailable) {
            if (latVer['meta']['updateRequired']) {
                if (latVer['meta']['updateRequired'] == true) {
                    updateRequired = true;
                }
            }
        }
        return {
            available: latestAvailable,
            version: latVer['version'],
            latestpubId: latVer['pubId'],
            required: updateRequired,
            updateMsg: latVer['meta']['updateMsg'] ? latVer['meta']['updateMsg'] : " "
        }

    } catch (error) {
        console.log(pubId + "\n ------")
        console.log(error)
        return {
            available: false,
            required: false
        }
    }
}
module.exports.checkIfUpdateAvailableObject = checkIfUpdateAvailableObject;

let generateOneWorksheetStub = async (wsid, pubid, wbuser) => {
    return new Promise(async (resolve, reject) => {
        try {
            let wsparts = wsid.split('-');
            let wbDetails1 = await getWBDetails(wsparts[0], pubid)
            let searchFn = (itm) => { return itm.wsId == wsid }
            let wsInfo = wbDetails1['sheets'].find(searchFn);
            if (wsInfo) {
                //console.log(wsInfo)
                let key = wbuser + "-" + wsid
                if (wbDetails1.isBeta == true) {
                    key += "_beta";
                }
                let wsView = await wsDb.view('web', 'checkWsExists', { key: key });
                if (wsView.rows.length > 0) {
                    // ws already made
                    resolve({ generated: false, id: wsView.rows[0].value['_id'] })
                } else {
                    let newWsDBId = await util.getNewWorksheetId();
                    let newStubDoc = {
                        _id: newWsDBId,
                        generateWorksheet: true,
                        wbuser: wbuser,
                        wsId: wsid,
                        wbId: wsparts[0],
                        pubId: pubid,
                        createdOn: util.getCurrentDateInUTC(),
                        mode: wsInfo['mode'],
                        reuse: 0
                    }
                    if (wbDetails1.isBeta) {
                        newStubDoc['beta'] = true;
                    }
                    //console.log(newStubDoc)
                    await wsDb.insert(newStubDoc)
                    resolve({ generated: true, id: newWsDBId })
                }
            } else {
                reject(util.generateError('notFound', 'Worksheet does not exists'))
            }
        } catch (error) {
            console.log(error)
            if (error.statusCode == 404) {
                reject(util.generateError('notFound', 'Workbook does not exists'))
            } else {
                reject(error)
            }
        }
    })
}
module.exports.generateOneWorksheetStub = generateOneWorksheetStub


let getWorksheetDetails = async (pubIb, wsId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let wsparts = wsId.split('-');
            let wbDetails1 = await getWBDetails(wsparts[0], pubIb)
            let searchFn = (itm) => { return itm.wsId == wsId }
            let wsInfo = wbDetails1['sheets'].find(searchFn);
            resolve(wsInfo);
        } catch (error) {
            console.log(error)
            if (error.statusCode == 404) {
                reject(util.generateError('notFound', 'Workbook does not exists'))
            } else {
                reject(error)
            }
        }
    })
}
module.exports.getWorksheetDetails = getWorksheetDetails

let getWSGradingMatrix = async (pubId, wsId) => {
    return new Promise(async (resolve, reject) => {
        try {
            //web/_view/pubIdWsIdToGradingMatrix 
            let wsInfo1 = await wbDb.view('web', 'pubIdWsIdToGradingMatrix', { key: pubId + "-" + wsId });
            // let wsInfo2 = await wbDb.view('web','pubIdToMeta',{key:pubId})
            //console.log(wsInfo2.rows[0].value['gmatrix'][wsId])
            //console.log(wsInfo1.rows[0].value)
            resolve(wsInfo1.rows[0].value);
        } catch (error) {
            console.log(error)
            if (error.statusCode == 404) {
                reject(util.generateError('notFound', 'Workbook does not exists'))
            } else {
                reject(error)
            }
        }
    })
}
module.exports.getWSGradingMatrix = getWSGradingMatrix