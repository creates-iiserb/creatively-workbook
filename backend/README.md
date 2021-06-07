## Setting up the app
- clone the app directory
- run `npm install` 
- add 'config.js' file in 'services' folder
- to run the app - `npm start`

## Git workflow
- Main branches - master , alpha , production 
- New feature
    - create a feature branch from master 
    ```
        git checkout master
        git pull
        git checkout -b initals_feat_name
    ```
    - commit all the changes made and keep `push`ing them
    - after completing the new feature , merge the feature branch into master - 
    ```
        git checkout master
        git pull
        git merge init_feat_name
        git push
    ```
    - To test the new feature on Alpha server
        - merge master to alpha
        - To make bug fixes - 
            - create a new hotfix branch from alpha, make the changes
            - merge the hotfix branch into alpha.
            - Create a pull request from alpha to master (now both alpha and master will have the hotfixes)
- releasing a software increment 
    - create a new relase branch from alpha. the name must include the version number. E.g.`release1.0.1`
    - semantic versioning - 
        - Given a version number MAJOR.MINOR.PATCH, increment the: 
            - MAJOR version when you make incompatible API changes, 
            - MINOR version when you add functionality in a backwards-compatible manner, 
            - and PATCH version when you make backwards-compatible bug fixes.
    - you can only make release related changes in the release branch
    - merge the release branch to the `production` branch
- makking hotfixes in the currently released version
    - make a hotfix branch from `production` with issue number/name
    - merge it with `production` as well as `master` and `alpha`.


## Development related
- Parameter names (must be consistent throughout the API)
  - `wbuser` - username/ user id/email  (route starting - /u/)
  - `wbid` - workbook id  (route starting - /w/)
  - `emailtoken` - email token
  - `subrid` - subscription id  (route starting - /s/)
  - `wsid` - worksheet id   (route starting - /w/)
- folder structure
    - each module is in a separate folder
    - for each module there are 2 files : api.js (contains the api definitions) and handler.js (controllers for each api route)

## API endpoints

## 1.User
`[POST] /user/ {wbuser,password,country, name}` 
- new user sign up
- input fields (required) - wbuser (email) , password , country , name
- Algorithm : **signUp**
 
`[GET]  /user/verify/u/:wbuser/:emailtoken `
- To verify the email and activate account
-  Algorithm : **verifyAccount**

`[PUT] /user/reset/u/:wbuser`
- to send email with a link to reset password
- required field - emailToken, password

`[PATCH] /user/reset/u/:wbuser`
- to reset password 
- required filed - emailtoken, password
- algorithm : **resetPassword**

`[POST] /user/login {wbuser,password}`
- to login
- required - email id and password
- algorithm - **login**

`[GET] /user/u/:wbuser` 
- to get details related to user with the given wbuser 

`[PUT] /user/u/:wbuser` 
- to update details of the given wbuser
- editable fields - name , password , image
- note  `image`  field should be in base64


## 2. Workbook
`[GET] /`  
- list of all workbooks to populate a list of all publicly available workbooks
- TODO - add pagination to load only a part of the list (keep requesting more item while scrolling down in the front end)
- view used - `workbook.web.idToPublicData` 
- note that only workbooks with the 'approval.status' set to 'approved' will be publicly visible   

`[GET] /u/:wbuser/beta`
- the list of all workbooks in which wbuser is added as a beta user by the author

`[GET] /w/:wbid`
- returns publicly available details of the worksheet with the given wbId
- view used - `workbook.web.idToPublicData` 

`[POST] /u/:wbuser/w/:wbid `
- to get a workbook
- to get a beta workbook, send {}

`[PUT] /u/:wbuser/w/:wbid` 
- to subscribe, or renew a workbook
- renewal is allowed only when the current subscription validty period is over 
- various actions related to a workbook
- subscribe the free version
- paid subscription 
- renew a workbook paid subscription
- convert free subscription to paid
- required field - wbid,action ('new','renew') , payment ('paid','free') 
- if payment is 'paid' , 'txnDetail' field consisting of {txnId, txnStatus} is also required

`[GET] /u/:wbuser/w/:wbid`
- returns details of a subscription.

`[GET] /u/:wbuser` 
- returns a list of workbooks , a user has subscribed 
- checks  - workbook validity , workbook discontinued
- returns - [{workbookid,title,valid(whether the validity period is over),publish(discontinued),subscription id, stars earned }]
- views used - `wbsubscriptions.web.wbuserTodoc`(at get the list of workbooks subscribed by a particular user) and `workbook.web.idToNameApprovalPublisherDescriptionLogo` (to get details of the workbooks a user has subscribed. )  
- the list consists of all the workbook  -  the ones which are discontinued and those whose validity is over

## 3.  Worksheet

`[GET] /time` TODO 
- implement it
- to get current server time in UTC

`[POST] /u/:wbuser/w/:wsid`  (secure,personalized) TODO -implement it
- to load a worksheet
-  input - mode, duration

 
`[PUT] /u/:wbuser/w/:wsid`
- to submit a worksheet

`[PATCH] /u/:wbuser/w/:wsid`
- to save response 
 
`[DELETE] /ws/u/:wbuser/w/:wsid`
- to reset a worksheet
 


## User Algorithms 

### signup
- check if {wbuser} not exists in the DB ( just `get` the doc with the provided wbuser id)
- check if the is not in the blacklist (defined in config)
- generate new document with provided wbuser.
    -   hash the password
    -   TODO add password validation
    -   generate an emailToken
    -   set status field to 0 (0 indicate - inactive,1 indicates active , -1 indicates blocked)
- insert the new document 
- send email to the user with link to activate account 

### verifyAccount
- on successful verification , the emailToken is set to random number
- TODO check email token validity

### login
- token based authentication using JWT
- steps -
- get document for given email id
- compare password and password hash and check if the user is active or not
- if matched , generate JWT token and send it 
- TODO implement single device login ,and check if password is changed

### resetPassword
- on successful password reset , the emailToken is set to random number

---
### Algorithm to get a workbook

Input   = {wbuser,wbid}

1. check if the subscription exists or not, using the view -  `wbsubscription.web.checkSubsrExists` searching for the key `wbuser\\\wbid`
2. If subscription does not exists
    1. add new record in the `wbsubscriptions`
3. If subscription exists
    1. not allowed (Already subscribed to a version) =>already own the item,  redirect to item in their library

### Algorithm to subscribe/renew a workbook - 

Input   = {wbuser,wbid,txn}
// For a  subscription/paid renewal ,txn must be include the txn id, else txn id will be 'free'
// Subscription will always be paid, whereas renewal can either be free or paid.

1. check if the subscription exists or not, using the view -  `wbsubscription.web.checkSubsrExists` searching for the key `wbuser\\\wbid`
2. If subscription does not exists  =>  invalid operation , first get the workbook
3. If subscription exists
    1. check subscription status (i.e. if current date exceeds the date of the end of subscription)
    2. check transction if txn id is provided.
    3.  if subscription is valid 
        1.  if current subscription = free => user want to upgrade from free to paid subscription =>  update record 
        2. if current subscription is paid
            1. if current date is within the daysBeforeSubscription(from config) => early renewal => add days left from the current subscription to the new subscription period.
            2. else, action not allowed as the user already has the paid subscription
    4. if subscription is not valid => renewal 
        1. push current subscription data to subscription history
        2. verify transaction details if txn provided , update record 


### Algorithm to generate list of subscriptions of a particular

Input - wbuser

1. Use the view `wbsubscriptions.web.wbuserToDoc`  (key - wbuser) to fetch all the subscription records of wbuser
2. For each subscription record - 
    1.  Check subscription validity
3. Get meta data of all the workbooks wbuser has subscribed to using the view  `workbook.web.idToNameApprovalPublisherDescriptionLogo`
4. push the metadata of workbooks in the subscription array.
5. This list will contain all the workbook even those that are discontinued or whose the validity is over

### Algorithm to get details of subscription

Input - wbuser , wbid

1. check if the subscription exisits  (will return a valid subscription id if exists)
2. get subscription data using subscription id provided in the above step
3. get details of the workbook with the input wbid
4.  check :
    4.1. if subscription is for a beta version
    4.2. check for new updates

1. Get the data of the provided subsrId from wbsubscription
2. Check the subscription validity of the subscription
3. Fetch the workbook details from wbworkbook db. The workbook id is stored inside the subscription record.



### How to use a worksheet ?
0. select the worksheet  // result - wbuser and wsid
1. display worksheet metadata
2. Start and load the worksheet
    1. check if a valid subscription exists (returns the type of subscription)
    2. check if worksheet exists using the view worksheet.web.wbuserwsidToData. This will return the worksheet id , if exists
    3. get the worksheet using the worksheet id,
    4. check : if db.mode = quiz, then req.mode cannot be lesson
    5. if response exists - (=> resume working on the worksheet) 
        1. calculate timespent by adding individual time spent per question
        2. if timespent > duration 
            1. if response.mode = lesson, return data with warning
            2. if respone.mode = quiz, autosubmit and return data with summary to be loaded in review mode
    6. else  (=> start new worksheet) 
        1. add new object response : {startedOn : currentdate , mode: req.mode, tempAnswers:[],  duration : }   
        2. response.duration = req.duration if db.mode = lesson , else response.duration = db.duration  
        3. return {submitted:false,data :element, answers : (if req.mode == lesson)}
    7.  number of elements (questions)  to send depends on the type of subscription (free or paid)

       
     



Once started - 
1. sync responses with backend at regular time interval
    PATCH /ws/ {wbuser,wsid,response}
    saveResponse({wbuser,wsid,response}){
        1. check if ws exits
        2. save response if startedOn exists and submittedOn does not exits
    }

2. calculate time spent per question
3. use hint/explantion
4. check answer in lesson mode
5. exit any time
6. submit worksheet for grading