require('dotenv').config()

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin");
var cloudinary = require('cloudinary');
const { CLOUDINARY_CONFIG, MONGO_URL} = process.env
cloudinary.config(CLOUDINARY_CONFIG);

var models = require('../models/models')

async function upload_file (file, folder_name){
    var file_url;
    await cloudinary.uploader.upload(file.tempFilePath,  function(error, result) { file_url = error.url}, {
        folder: folder_name,
        use_filename: true,
        unique_filename : true,
        });
    return file_url;
}

exports.addDisease = async function (req, res){
    if (req.body.disease){
        MongoClient.connect(MONGO_URL,async function (err, db){
            if (!err) {
                console.log('Connected to DB',err);
            }
            var _db = db.db('care_tracker')
            var searchNumber =await _db.collection("disease").findOne({'disease' :req.body.disease}, async function(err, result) {
            if (err) throw err;
            console.log(result);
            if(result){ 
                var response = {'status': false, message : "Disease Arealdy Exists"}
                res.json(response);
            }else{
                await _db.collection('disease').insertOne({
                    disease :req.body.disease,
                })
                var response = {'status': true, message : "Add Disease successfully"}
                res.json(response);
             }
             })
             //db.close();
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
       var dbData = db.db('care_tracker')
       const insert = await dbData.collection("disease").find({})
           .toArray(function (err, result) {
               if (err) throw err;
               var resp = {
                   status : true, 
                   data : result
               }
               res.status(200);
               res.json(resp);
               // res.json(result);
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
                    var _db = db.db('care_tracker')
                    const update = await _db.collection('disease').updateOne({
                        "disease": req.body.disease
                    }, {
                        $set: {
                            disease : req.body.mergeDisease,
                        }
                    });
                   
                    var response;
                    if (update.acknowledged) {
                        response = {'status': true}                        
                    }else{
                        response = {
                            status : false,
                            message : "Merge Failed"
                        }
                    }
                    //db.close(); 
                    res.json(response);
                })
            }else{                   
                var response = {
                    status : false,
                    message : "File upload Failed"
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
                var _db = db.db('care_tracker')
                const deleteP = await _db.collection('disease').deleteOne(
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



