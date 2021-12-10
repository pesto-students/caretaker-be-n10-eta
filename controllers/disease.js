require('dotenv').config()

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin");
var cloudinary = require('cloudinary');
const { CLOUDINARY_CONFIG, MONGO_URL} = process.env
cloudinary.config(CLOUDINARY_CONFIG);

var models = require('../models/models')
var consts= require('../constants/constants')
const{DATABASE_NAME,PROFILES_COLLECTION,USERS_COLLECTION,DISEASE_COLLECTION}= consts.constants

 

exports.addDisease = async function (req, res){
    if (req.body.disease){
        MongoClient.connect(MONGO_URL,async function (err, db){
            if (err) {
                console.log('Error connection DB',err);
            }
            var _db = db.db(DATABASE_NAME)
            var searchNumber =await _db.collection(DISEASE_COLLECTION).findOne({'disease' :req.body.disease}, async function(err, result) {
            if (err) throw err;
            if(result){ 
                var response = {'status': false, message : "Disease Arealdy Exists"}
                res.json(response);
            }else{
                await _db.collection(DISEASE_COLLECTION).insertOne({
                    disease :req.body.disease,
                })
                var response = {'status': true, message : "Add Disease successfully"}
                res.json(response);
             }
             })
            
        })
          db.close();
    }else{                   
        var response = {
            status : false,
            message : "Invalid data"
        }
        res.json(response);
    }

}


exports.getDisease= async function (req, res){
    MongoClient.connect(MONGO_URL, async function(err, db) {
       if (err) throw err;                
       var dbData = db.db(DATABASE_NAME)
       const insert = await dbData.collection(DISEASE_COLLECTION).find({})
           .toArray(function (err, result) {
               if (err) throw err;
               var resp = {
                   status : true, 
                   data : result
               }
               res.status(200);
               res.json(resp);
             
           });
           db.close();
      
   });
}




exports.mergeDisease = async function (req, res){
            if(req.body.disease){
                MongoClient.connect(MONGO_URL,async function (err, db){
                    if (err) {
                        console.log('DB error', err);
                    }
                    var _db = db.db(DATABASE_NAME)
                    const update = await _db.collection(DISEASE_COLLECTION).updateOne({
                        "disease": req.body.disease
                    }, {
                        $set: {
                            disease : req.body.mergeDisease,
                        }
                    });
                   
                    var response;
                    if (update.acknowledged) {
                        response = {'status': true , message :"Successfully Merge Disease"}                        
                    }else{
                        response = {
                            status : false,
                            message : "Merge Failed"
                        }
                    }
                   
                    res.json(response);
                })
            }else{                   
                var response = {
                    status : false,
                    message : "Invalid data"
                }
                res.json(response);
            }
}

exports.deleteDisease = async function (req, res) {
        const {disease} =req.body
            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                if (!err) {
                    console.log('Connected to DB');
                }
                var _db = db.db(DATABASE_NAME)
                const deleteP = await _db.collection(DISEASE_COLLECTION).deleteOne(
                    {
                        "disease" :disease
                    }                    
                    );
                    console.log(deleteP);
                    if (deleteP.deletedCount) {   
                        var result = {'status': true ,message :"Successfully Delete Disease"}
                        res.status(200);
                        res.json(result);
                    }else{
                        var result = {'status': false, message : " Unable to delete"}
                        
                        res.status(200);
                        res.json(result);

                    }
                    db.close();
            })
}



