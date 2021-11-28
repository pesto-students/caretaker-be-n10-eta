require('dotenv').config()
var express = require('express');
var multer = require('multer');     
var cors = require("cors");

var MongoClient = require('mongodb').MongoClient;
var admin = require("firebase-admin");
var serviceAccount = require("../caretracker-16078-firebase-adminsdk-zm8yx-a2d439dc7c.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

exports.login = function (req, res) {   
    console.log(req.body)
    var params = JSON.parse(JSON.stringify(req.body));
    admin.auth()
    .verifyIdToken(params.access_token)
    .then((decodedToken) => {
        const uid = decodedToken.uid;
        console.log ('FB res', decodedToken)
        MongoClient.connect(process.env.MONGO_URL,async function (err, db){
            if (!err) {
                var _db = db.db('care_tracker')
                var search_result = true;
                const search = await _db.collection("users").findOne({'phone_number' :decodedToken.phone_number}, async function(err, result) {
                    if (err) throw err;
                    console.log('reult',result);
                    if(!result){                        
                        search_result = false;
                        console.log ('sr in scope', search_result)
                        var UserDetails = {
                            user_name : "",
                            phone_number : decodedToken.phone_number,
                            user_email : "",
                            user_type : "user",
                            user_photo : "",
                            user_status : "new",
                            user_fb_uid : decodedToken.uid,
                        };
                        const insert = await _db.collection('users').insertOne(UserDetails);
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
    // res.json(req.body);
            
}