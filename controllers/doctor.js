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

exports.doctorAdd = async function (req, res){
    const {phone_number,user_name,doctor_expertise,doctor_experience,doctor_fees } =req.body
    var fileGettingUploaded = req.files.doctorProfilePhoto;
    var doctorProPhoto = ""
    if (req.files.doctorProfilePhoto && phone_number &&  doctor_expertise){
        doctorProPhoto = await upload_file(fileGettingUploaded,'doctor_profile_photos' )
        console.log('fileData', doctorProPhoto)
    
        MongoClient.connect(MONGO_URL,async function (err, db){
            if (!err) {
                console.log('Connected to DB',err);
            }
            var _db = db.db('care_tracker')
            var searchNumber =await _db.collection("users").findOne({'phone_number' :phone_number}, async function(err, result) {
            if (err) throw err;
            console.log(result);
            if(result){ 
                var response = {'status': false, message : "User Arealdy Exists with Number"}
                res.json(response);
             }else{
                await _db.collection('users').insertOne({
                    user_name :user_name,
                    phone_number : phone_number,
                    user_type : "doctor",
                    doctor_experience : doctor_experience,
                    doctor_expertise : doctor_expertise,
                    doctor_fees : doctor_fees,
                    doctorProfilePhoto:doctorProPhoto
                })
                var response = {'status': true, message : "Add Doctor successfully"}
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


exports.getDoctors= async function (req, res){
    MongoClient.connect(MONGO_URL, async function(err, db) {
       if (err) throw err;                
       var dbData = db.db('care_tracker')
       const insert = await dbData.collection("users").find({user_type: 'doctor'})
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

