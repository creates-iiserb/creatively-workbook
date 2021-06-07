// const config = require('../services/config');
const nano = require('nano')(config.getEnv('dbServer'));
const subDb = nano.db.use('wbsubscriptions');
const wsDb = nano.db.use('worksheets')
const forumDB = nano.db.use('wbforum');
const gDb = nano.db.use('global')
const utils = require('../services/utilities');
const wbdets = require('../services/wbDetails');


let getNewForumId = async () => {
  try {
    let maxCount = await forumDB.view('byAdmin', 'getAvailableId');
    if (maxCount) {
      let newId = maxCount.rows[0].value + 1;
      let newId5 = "0000".concat(newId.toString(36)).slice(-5)
      // console.log("New forum id = " + newId5)
      return newId5
    } else {
      throw utils.generateError('', '')
    }
  } catch (error) {
    throw error
  }

}


let forumDoc = async (docId, ref, options = { generateNew: false, docType: '' }) => {

  try {
    // options - generateNew : true - generate new doc if it does not exists, if set to false , blank doc returned without creating a new one
    let blankDoc = {
      docId: docId,
      docType: options['docType'],
      ref: ref,
      entries: [],
      views: [],
      likes: []
    }
    // web/_view/wsIdQueIdToDoc
    let fdb = await forumDB.view('web', 'wsIdQueIdToDoc', { key: docId + "-" + ref })
    // console.log(fdb)
    if (fdb.rows.length > 0) {
      return fdb.rows[0].value
    } else {
      if (options.generateNew) {
        // generate a blank doc
        if (!options.docType || options.docType == "") {
          throw utils.generateError('docTypeReq', 'Forum document type not provided')
        }
        blankDoc['_id'] = await getNewForumId();
        blankDoc['createdOn'] = utils.getCurrentDateInUTC()
        let insertNew = await forumDB.insert(blankDoc);
        blankDoc['_rev'] = insertNew['rev']
      } else {
        blankDoc['docCreated'] = false
      }
      return blankDoc
    }
  } catch (error) {
    throw error
  }
}

// forumDoc('')

// TODO check subscription 

let loadForum = async (req, res, next) => {
  try {
    let input = {
      docId: req.params.docId,
      ref: req.params.ref
    }
    let data = await forumDoc(input.docId, input.ref);
    res.success(data)
  } catch (error) {
    res.error(error)
  }
}
module.exports.loadForum = loadForum

let newEntry = async (req, res, next) => {
  try {
    await utils.inspectJSON(req.body, { requiredFields: ['type', 'data'], validFields: ['type', 'data', 'docType'] })
    let input = {
      wbuser: req.valid_username,
      docId: req.params.docId,
      ref: req.params.ref,
      type: req.body.type,
      data: req.body.data,
      docType: req.body.docType
    }
    let forumDocu = await forumDoc(input.docId, input.ref, { generateNew: true, docType: input.docType })
    // await utils.inspectJSON(input, { requiredFields: ['wbuser', 'subId'], validFields: ['wbuser', 'subId'] })

    if (input.type == 'entry') {
      let validEntry = {
        'question': {
          'validations': {
            requiredFields: ['statement', 'type'],
            validFields: ['statement', 'anonymous', 'type']
          },
          'process': (data) => {
            let data1 = JSON.parse(JSON.stringify(data));
            data1['wbuser'] = input.wbuser
            data1['parent'] = "none";
            const currDate = Date.now();
            data1['timestamp'] = currDate;
            data1['randomId'] = utils.generateTokenN(7);
            data1['active'] = true // to allow answers
            return data1
          }
        },
        'answer': {
          'validations': {
            requiredFields: ['statement', 'parent', 'type'],
            validFields: ['statement', 'anonymous', 'type']
          },
          'process': (data) => {
            // parent format - timestamp-randomId
            let data1 = JSON.parse(JSON.stringify(data));

            // check if parent is valid and if answer if allowed 
            let keys = data1['parent'].split('-')
            let findPar = forumDocu['entries'].find(itm => { return itm['randomId'] == keys[1] && itm['timestamp'] == keys[0] })
            if (!findPar) {
              throw new Error("Invalid question id")
            } else {
              if (findPar['active'] == false) {
                throw new Error("Posting answer not allowed")
              }
            }

            data1['wbuser'] = input.wbuser
            const currDate = Date.now();
            data1['timestamp'] = currDate;
            data1['randomId'] = utils.generateTokenN(7);
            data1['active'] = true // to allow comments
            return data1
          }
        },
        'comment': {
          'validations': {
            requiredFields: ['statement', 'parent', 'type'],
            validFields: ['statement', 'anonymous', 'type']
          },
          'process': (data) => {
            // parent format - timestamp-randomId
            let data1 = JSON.parse(JSON.stringify(data));

            // check if parent is valid and if answer if allowed 
            let keys = data1['parent'].split('-')
            let findPar = forumDocu['entries'].find(itm => { return itm['randomId'] == keys[1] && itm['timestamp'] == keys[0] && itm['type'] == "answer" })
            if (!findPar) {
              throw new Error("Invalid answer id")
            } else {
              if (findPar['active'] == false) {
                throw new Error("Posting comment is not allowed")
              }
            }

            data1['wbuser'] = input.wbuser
            const currDate = Date.now();
            data1['timestamp'] = currDate;
            data1['randomId'] = utils.generateTokenN(7);
            data1['active'] = true // to allow comments
            return data1
          }
        },
        'rating': {
          'validations': {
            requiredFields: ['type', 'rating','pubId'],
            validFields: ['statement', 'type', 'rating','parent','pubId']
          },
          'process': (data) => {
            // parent format - timestamp-randomId
            let data1 = JSON.parse(JSON.stringify(data));

            // check if parent is valid and if answer if allowed 
            
            let findRExists = forumDocu['entries'].find(itm => { return itm['wbuser'] == input.wbuser && itm['type'] == "rating" })
            if (findRExists) {
              throw new Error("Already rated")
            } 
            data1['wbuser'] = input.wbuser
            const currDate = Date.now();
            data1['timestamp'] = currDate;
            data1['randomId'] = utils.generateTokenN(7);
            data1['active'] = true // to allow comments
            return data1
          }
        }
      }



      await utils.inspectJSON(input.data, {
        requiredFields: ['type', 'parent', 'statement'],
        validFields: ['type', 'parent', 'statement', 'anonymous','rating','pubId'],
        acceptBlank: false
      })

      let refinedData = validEntry[input.data.type]['process'](input.data);

      forumDocu['entries'].push(refinedData)


      // res.success(forumDocu)
      //console.log(validEntry[input.type][])
      // console.log(input.type)
      //if(!input.data['type']){
      //  res.error("Valid entry type not provided")
      //}
      //console.log(validEntry[input.data.type]['validations'])
      // await utils.inspectJSON(input.data, validEntry[input.data.type]['validations'])

    } else if (input.type == 'like') {

      await utils.inspectJSON(input.data, {
        requiredFields: ['parent', 'like'],
        validFields: ['parent', 'like', 'delete'],
        acceptBlank: false
      })








      let process = (data) => {



        let result = {}
        // parent format - timestamp-randomId
        let data1 = JSON.parse(JSON.stringify(data));


        let isDelete = false
        if (data1['delete']) {
          isDelete = true
          delete data1['delete']
        }

        // check if parent is valid and if answer if allowed 
        let keys = data1['parent'].split('-')
        let findPar = forumDocu['entries'].find(itm => { return itm['randomId'] == keys[1] && itm['timestamp'] == keys[0] })
        if (!findPar) {
          throw new Error("Invalid entry ID")
        }

        let findLike = forumDocu['likes'].findIndex(itm => { return itm['wbuser'] == input.wbuser && itm['parent'] == data1['parent'] })

        //console.log(findLike)

        data1['wbuser'] = input.wbuser
        const currDate = Date.now();
        data1['timestamp'] = currDate;
        data1['randomId'] = utils.generateTokenN(7);



        if (findLike > -1) {
          result['status'] = "exists";
          result['index'] = findLike

          if (isDelete) {
            result['status'] = "delete";
          }
          // throw new Error("Entry already exists")
        } else {
          result['status'] = "new";
          result['data'] = data1
        }


        return result
      }


      let refinedLike = process(input.data);

      //console.log(refinedLike)

      if (refinedLike['status'] == 'new') {
        forumDocu['likes'].push(refinedLike['data'])
      } else if (refinedLike['status'] == 'exists') {
        forumDocu['likes'][refinedLike['index']]['like'] = input['data']['like']
      } else if (refinedLike['status'] == 'delete') {
        forumDocu['likes'].splice(refinedLike['index'], 1)
      }

    } else if (input.type == 'view') {



      await utils.inspectJSON(input.data, {
        requiredFields: ['parent'],
        validFields: ['parent'],
        acceptBlank: false
      })


      let process = (data) => {
        // parent format - timestamp-randomId
        let data1 = JSON.parse(JSON.stringify(data));

        // check if parent is valid and if answer if allowed 
        let keys = data1['parent'].split('-')
        let findPar = forumDocu['entries'].find(itm => { return itm['randomId'] == keys[1] && itm['timestamp'] == keys[0] })
        if (!findPar) {
          throw new Error("Invalid entry ID")
        }

        let findLike = forumDocu['views'].find(itm => { return itm['wbuser'] == data1['wbuser'] && itm['parent'] == data1['parent'] })
        if (findLike) {
          throw new Error("Entry already exists")
        }

        data1['wbuser'] = input.wbuser
        const currDate = Date.now();
        data1['timestamp'] = currDate;
        data1['randomId'] = utils.generateTokenN(7);

        return data1
      }

      let refinedView = process(input.data);
      forumDocu['views'].push(refinedView)
    }

    await forumDB.insert(forumDocu)
    // console.log(forumDocu)

    res.success(forumDocu)

  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.newEntry = newEntry

let editMetaData = async (req, res, next) => {
  try {

  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.editMetaData = editMetaData

let deleteEntry = async (req, res, next) => {
  try {

  } catch (error) {
    console.log(error)
    res.error(error)
  }
}
module.exports.deleteEntry = deleteEntry