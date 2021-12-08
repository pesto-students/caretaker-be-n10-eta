require('dotenv').config()

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin");
var models = require('../models/models')
var validate = require('./validateUser')

 
exports.addReqDisease = async function (req, res){
   const {reqDisease,userName}= req.body
  
            if (reqDisease){
                MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                    if (!err) {
                        console.log('Connected to DB',err);
                    }
                    var _db = db.db('care_tracker')
                    var searchNumber =await _db.collection("disease").findOne({'disease' :reqDisease}, async function(err, result) {
                    if (err) throw err;
                    console.log(result);
                    if(result){ 
                        var response = {'status': false, message : "Disease Arealdy Exists"}
                        res.json(response);
                    }else{
                        await _db.collection('reqDisease').insertOne({
                            reqDisease :reqDisease,
                            userName : userName
                        })
                        db.close();
                        var response = {'status': true, message : "Add Disease successfully"}
                        res.json(response);
                    }
                    })
                    
                })
                
            }else{                   
                var response = {
                    status : false,
                    message : "Invalid data"
                }
                res.json(response);
            }
}

exports.getReqDisease= async function (req, res){
    MongoClient.connect(process.env.MONGO_URL, async function(err, db) {
       if (err) throw err;                
       var dbData = db.db('care_tracker')
       const insert = await dbData.collection("reqDisease").find({})
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


exports.deleteReqDisease = async function (req, res) {
        const {reqDisease} =req.body
            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                if (!err) {
                    console.log('Connected to DB');
                }
                var _db = db.db('care_tracker')
                const deleteP = await _db.collection('reqDisease').deleteOne(
                    {
                        "reqDisease" :reqDisease
                    }
                    
                    );
                    console.log(deleteP);
                    if (deleteP.deletedCount) {
                        
                        var result = {'status': true ,message :"Successfully Delete requested Disease"}
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



