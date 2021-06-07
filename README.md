Workbook app
to run backend add `configEnv.js` file inside backed/services

```
module.exports = {
    "dbServer": "couchdb db url",
    "configDBName":"global",
    "configDocName":"config_workbook",
}
```

to run frontend app, add following in config service 

```
    baseUrl: "base url of wb api",
    backEndRoutes: {
      listWbGET: "/store",
      detailsWbGET: "/store",
      searchWbPOST: "/store",
      loginPOST: "/user/login",
      signupPOST: "/user",
      verifyGET: "/user/verify",
      resetLinkGET: "/user/reset",
      resetPwdPOST: "/user/reset",
      profile: "/user/u/",
      library: "/library",
      subscr: "/store",
      store: "/store",
      betaStore: "/store/beta",
      socialLogin: "/user/socialLogin",
      ytVideo: "",
      plotlyUrl:"",
      image: "",
      pdfUrl: "",
      forums: "/forum",
      userImage: "/user/image/",
      subscribe: "/subscribe/",
    }

```