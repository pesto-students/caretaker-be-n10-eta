require('dotenv').config()
var admin = require("firebase-admin");
 
exports.validateUser = async (access_token)=>{
    var resp;
    console.log(access_token,'access_token')
    await admin.auth()
    .verifyIdToken(access_token)
    .then((decodedToken) => {
        resp = decodedToken
    })
    .catch((error) => {
        console.log(error)     
        console.log("authentication failed in validate user")     
        resp =  false;
    });
    return resp;
}
