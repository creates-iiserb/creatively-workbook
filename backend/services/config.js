data = require("./configEnv");
const nano = require('nano')(data['dbServer']);
const gDb = nano.db.use(data['configDBName'])

let generateConfig = async ()=>{
    let data1 = await gDb.get(data['configDocName']);
    let envC = data1['env'];
    let progC = data1['prog'];
    let data2 = Object.assign(envC, progC)
    data = Object.assign(data, data2);
}

module.exports.get = async (key) => {
    try {
        //console.log("getting key = ",key)
        if (Object.keys(data).length == 3) {
            // console.log("object not loaded")
            // let data1 = await gDb.get(data['configDocName']);
            // data = Object.assign(data, data1);
            await generateConfig()
            // console.log(data)
            console.log("Configs loaded from DB")
        }
        if (!data[key]) {
            throw new Error("Config not found " + key);
        }
        // console.log("returning....",data[key])
        return data[key]
    } catch (error) {
        throw error
    }
};

module.exports.getEnv = (key) => {
    // console.log("getting env....",key)
    if (!data[key]) {
        throw new Error("Env config not found " + key);
    }
    // console.log("returning....",data[key])
    return data[key]
};

module.exports.getInner = async (key, subKey) => { 
    try {
        // console.log("getting  outer key = ",key,', inner key = ',subKey);
        if (Object.keys(data).length == 3) {
            // console.log("object not loaded")
            // let data1 = await gDb.get(data['configDocName']);
            // data = Object.assign(data, data1);
            await generateConfig()
            // console.log(data)
            console.log("Configs loaded from DB")
        }

        if (!data[key]) {
            throw new Error("Config not found " + key);
        }
        // console.log("returning....",data[key])
        return data[key][subKey] 
    } catch (error) {
        throw error
    }

   

};