require('dotenv').config()
var express = require('express');
var multer = require('multer');     
var cors = require("cors");

var MongoClient = require('mongodb').MongoClient;
var admin = require("firebase-admin");
var serviceAccount = require("../caretracker-16078-firebase-adminsdk-zm8yx-a2d439dc7c.json");
var consts= require('../constants/constants')
const{DATABASE_NAME,PROFILES_COLLECTION,USERS_COLLECTION,DISEASE_COLLECTION}= consts.constants
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};
//Login contorller, takes firebase access token to validate user
exports.login = function (req, res) {  
    var params = JSON.parse(JSON.stringify(req.body));
    admin.auth()
    .verifyIdToken(params.access_token)
    .then((decodedToken) => {
        const uid = decodedToken.uid;
        MongoClient.connect(process.env.MONGO_URL,async function (err, db){
            if (!err) {
                var _db = db.db('care_tracker')
                var search_result = true;
                const search = await _db.collection(USERS_COLLECTION).findOne({'phone_number' :decodedToken.phone_number}, async function(err, result) {
                    if (err) throw err;
                    if(!result){                        
                        search_result = false;
                        var UserDetails = {
                            user_name : "",
                            phone_number : decodedToken.phone_number,
                            user_email : "",
                            user_type : "user",
                            user_photo : "",
                            user_status : "new",
                            user_fb_uid : decodedToken.uid,
                        };
                        const insert = await _db.collection(USERS_COLLECTION).insertOne(UserDetails);
                        db.close();
                        var response = {
                            status : true,
                            user_details : UserDetails
                        }
                        res.status(200);
                        res.json(response);
                    }else{
                        var response = {
                            status : true,
                            user_details : result
                        }
                        res.status(200);
                        res.json(response);
                    }
                });
                
            }else{
                console.log('DB error', err)
            }
        });
    })
    .catch((error) => {
        console.log('error in catch', error)
        var response = {
            status : false
        }
        res.json(response);
    });
            
}