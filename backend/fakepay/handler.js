var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
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

module.exports.fakeTransact = async (req,res,next)=>{ 
    //console.log(req.body)
    let rno = Math.floor(Math.random() * 100); 
    let success ;  
    if(rno%2==0){
        success = true;
    }else{
        // return false
        success = false;
    } 
   // var buf = new Buffer("Simply Easy Learning", "utf-8");
   // console.log(buf)
   // console.log("generate callback ")
   //  let dat  = JSON.parse(atob(base64EncodedJSON));
    // let dat  = JSON.parse(atob(base64EncodedJSON));
    let dat = Buffer.from(JSON.stringify(req.body)).toString('base64')
    let page = await toHTML('fakepay/paymentPage.ejs', {callbackurl:req.body['CALLBACK_URL'],data:dat})
    //console.log(page)
    res.send(page)
    // res.redirect(req.body['CALLBACK_URL']+"?status="+success+"&data='somedata'")
}