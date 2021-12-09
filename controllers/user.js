require('dotenv').config()
var unlink  =  require('fs').unlink;
const fs = require('fs').promises;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin");
var cloudinary = require('cloudinary');
var QRCode = require('qrcode')
const { RekognitionClient, DetectTextCommand } = require("@aws-sdk/client-rekognition");
const { v1: uuidv1,v4: uuidv4} = require('uuid');
var aws = require("aws-sdk");
cloudinary.config(process.env.CLOUDINARY_CONFIG);
var models = require('../models/models')         
const {MONGO_URL} = process.env;  
var consts= require('../constants/constants')
const{DATABASE_NAME,PROFILES_COLLECTION,USERS_COLLECTION,DISEASE_COLLECTION}= consts.constants


async function validate_user (access_token){
    var resp;
    await admin.auth()
    .verifyIdToken(access_token)
    .then((decodedToken) => {
        resp = decodedToken
    })
    .catch((error) => {
        console.log(error)       
        resp =  false;
    });
    return resp;
}

async function upload_file (file, folder_name){
    var file_url;
    await cloudinary.uploader.upload(file.tempFilePath,  function(error, result) { file_url = error.url}, {
        folder: folder_name,
        use_filename: true,
        unique_filename : true,
        });
    return file_url;
}

async function upload_local_file (file, folder_name){
    var file_url;
    await cloudinary.uploader.upload(file,  function(error, result) { file_url = error.url}, {
        folder: folder_name,
        use_filename: true,
        unique_filename : true,
        });
    return file_url;
}

async function analyze_report (file){
    var image;
    var xyz = await fs.readFile(file.tempFilePath)
    s3 = new aws.S3({apiVersion: '2006-03-01'});
    image = uuidv4()+file.name
    var params123 = {Bucket: 'caretrackerreports', Key: image, Body: xyz};
    var upload = await s3.upload(params123,async function(err, data1) {
        return data1;
    }).promise()
    const client = new RekognitionClient({ region: "ap-south-1"});
    const params = {
        Image : {
            S3Object: {
                Bucket:'caretrackerreports',
                Name : image
            }
        }
    };
    if(!upload.failed){
        // console.log('upload', upload)
        
    }
    const command = new DetectTextCommand(params);
    const response = await client.send(command,params);
    var size  = Object.keys(response.TextDetections).length;
    var Haemoglobin, rbc,wbc,data = "";
    for (var key of Object.keys(response.TextDetections)) {
        var text = response.TextDetections[key].DetectedText;
        var type = response.TextDetections[key].Type;
        if(text == "Haemoglobin" && type == "LINE"){
            nextIndex =parseInt(key) +1
            Haemoglobin = response.TextDetections[nextIndex].DetectedText
        }
        if(text == "Total RBC Count" && type == "LINE"){
            nextIndex =parseInt(key) +1
            rbc = response.TextDetections[nextIndex].DetectedText
        }
        if(text == "Total WBC Count" && type == "LINE"){
            nextIndex =parseInt(key) +1
            wbc = response.TextDetections[nextIndex].DetectedText
        }
        data = {
            Haemoglobin:Haemoglobin,
            RBC:rbc,
            WBC:wbc,
        }
    }
    return data
}

exports.updateAccountDetails = async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
    const {files} = req;
     await validate_user(params.access_token).then(async (response)=>{
        if(response){      
            var uid = response.uid;
            var phone_number = response.phone_number;
            // var fileGettingUploaded = files.profile_photo;
            // var file_url = await upload_file(fileGettingUploaded,'profile_photos' )
            
            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                if (err) {
                    console.log('DB error', err);
                }
                var _db = db.db(DATABASE_NAME)
                const update = await _db.collection(USERS_COLLECTION).updateOne({
                    "phone_number": phone_number
                }, {
                    $set: {
                        user_name :params.user_name,
                        user_email : params.user_email, 
                        // user_photo : file_url,
                        user_status : 'old'
                    }
                });
                db.close();
                var response;
                if (update.acknowledged) {
                    response = {'status': true}                        
                }else{
                    response = {
                        status : false,
                        message : "File upload Failed"
                    }
                }
                db.close();
                res.json(response);
            })
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    })

}

exports.getUser_details = async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
    const {MONGO_URL} = process.env;
     await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var phone_number = response.phone_number;            
            MongoClient.connect(MONGO_URL,async function (err, db){
                if (err) {
                    console.log('Error DB',err);
                }
                var _db = db.db(DATABASE_NAME)
                var search_result;
                const search = await _db.collection(USERS_COLLECTION).findOne({phone_number:phone_number})
                var response;
                if (search) {
                    response = {'status': true,
                        data : search
                    }                        
                }else{
                    response = {
                        status : false,
                        message : "Details Not Found"
                    }
                }
                db.close();
                res.status(200);
                res.json(response);
            })
           
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    })
}

exports.create_profile = async function (req, res) {
    var params = JSON.parse(JSON.stringify(req.body));    
    const {MONGO_URL} = process.env;
     await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var phone_number = response.phone_number;
            var reports_upload = [];
            var reports_ocr = [];
              if (req.files && Object.keys(req.files).length != 0) {
                  const {reports} = req.files;
                if (reports && Object.keys(reports).length != 0)
                {
                    for await(var index of Object.keys(reports)) {
                      const file = reports[index];
                      var file_url = await upload_file(file,'reports')
                      var analyze_report_resp = await analyze_report(file);
                        var datetime = new Date();
                        var temp = {
                            file_url : file_url,
                            OCR : analyze_report_resp,
                            uploaded_at : datetime
                        }
                        reports_upload.push(temp);                                     
                    }
                }
            }
            
            MongoClient.connect(MONGO_URL, function(err, db) {
                if (err) throw err;
                var dbData = db.db(DATABASE_NAME)
                var obj={
                    name : params.name,
                    age : params.age,
                    blood_group : params.blood_group,
                    disease : params.disease,
                    gender : params.gender,
                    emergency_contact : params.emergency_contact,                    
                }
                dbData.collection(PROFILES_COLLECTION).insertOne({ user_fb_uid: uid,                 
                    userNumber: phone_number,
                    profile_details :obj,
                    reports : reports_upload, 
                    profile_status : 1, 
                    profile_photo : "",
                    qr_code : ""
                }, 
                function(err, result) {
                    if (err) throw err;

                    if (result.acknowledged) {
                        let insertId = ObjectId(result.insertedId).toString();
                        let filepath = '/tmp/'+insertId+'.png';
                        QRCode.toFile(filepath, 'https://caretracker.netlify.app/emerygencydetails?pid='+insertId, {
                            color: {
                              dark: '#00F',  // Blue dots
                              light: '#0000' // Transparent background
                            }
                          }, async function (err) {
                            if (err){
                                console.log(err)                                 
                            }                         
                            var qrlink = await upload_local_file(filepath,'qrcodes') 
                            MongoClient.connect(MONGO_URL,async function (err, db){
                                var _db = db.db(DATABASE_NAME)
                                var ObjectId = require('mongodb').ObjectID;
                                var profile_photo = ""
                                if (req.files && Object.keys(req.files).length != 0) {
                                    const { profile_photo} = req.files;
                                    if(profile_photo){
                                        var fileGettingUploaded = profile_photo;
                                        profile_photo = await upload_file(fileGettingUploaded,'profile_photos' )
                                    }
                                }
                               const update = await _db.collection(PROFILES_COLLECTION).updateOne({
                                "_id": result.insertedId
                                }, {
                                    $set: {
                                        qr_code : qrlink,
                                        profile_photo : profile_photo
                                    }
                                });
                                unlink(filepath, (err) => {
                                    if (err) throw err;
                                  });
                            })
                        })
                        var resp = {
                            status : true, 
                            data : result.insertedId
                        }
                        res.json(resp);
                    }else{
                        var resp = {
                            status : false
                        }
                        res.json(resp);
                    }
                    db.close();
                });
            });
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    });
}

exports.get_profile_list = async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var phone_number = response.phone_number;            
            const {MONGO_URL} = process.env;            
            MongoClient.connect(MONGO_URL, async function(err, db) {
                if (err) throw err;                
                var dbData = db.db(DATABASE_NAME)
                const insert = await dbData.collection(PROFILES_COLLECTION).find({userNumber: phone_number})
                    .toArray(function (err, result) {
                        if (err) throw err;
                        var resp = {
                            status : true, 
                            data : result
                        }
                        res.status(200);
                        res.json(resp);
                    });               
            });
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    });
}

exports.delete_profile = async function (req, res) {
    var params = JSON.parse(JSON.stringify(req.body));
    await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var profile_id = params.profile_id;                   
            const {MONGO_URL} = process.env;            
            MongoClient.connect(MONGO_URL,async function (err, db){
                var _db = db.db(DATABASE_NAME)
                const deleteP = await _db.collection(PROFILES_COLLECTION).deleteOne(
                    {
                        "_id": ObjectId(profile_id)
                    }                    
                    );
                    if (deleteP.deletedCount) {                        
                        var result = {'status': true}
                        res.status(200);
                        res.json(result);
                    }else{
                        var result = {'status': false, message : " Unable to delete"}                        
                        res.status(200);
                        res.json(result);
                    }
                    db.close();
            })
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    })
}

exports.get_emergency_details = async function (req, res){    
    var params = JSON.parse(JSON.stringify(req.body));
    var profile_id = params.pid;
    MongoClient.connect(MONGO_URL,async function (err, db){
        if (err) {
            console.log('DB error', err);
        }
        var _db = db.db(DATABASE_NAME)
        const details = await _db.collection(PROFILES_COLLECTION).findOne(
            {
                "_id": ObjectId(profile_id)
            }
            
            );
            if (details) {
                
                var result = {'status': true,
                                data : details
                            }
                res.status(200);
                res.json(result);
            }else{
                var result = {'status': false, message : " No details found"}                
                res.status(200);
                res.json(result);

            }
            db.close();
    })
       
}

exports.upload_report = async function (req, res){
    const { body , files} = req;
    console.log(files);
    await validate_user(body.access_token).then(async (response)=>{
        if(response){    
            var uid = response.uid;
            var phone_number = response.phone_number;       
            var reports = [];      
            if (files.reports && Object.keys(files.reports).length != 0)
            {
                for(var index of Object.keys(req.files.reports)) {
                  const file = req.files.reports[index];
                  var file_url = await upload_file(file,'reports')
                  var analyze_report_resp = await analyze_report(file);
                    var datetime = new Date();
                    var temp = {
                        file_url : file_url,
                        OCR : analyze_report_resp,
                        uploaded_at : datetime
                    }
                  reports.push(temp);                        
                }
                for (var key of Object.keys(reports)) {
                    let where = {
                        _id :ObjectId(body.pid)
                    }
                    let data = {
                        reports : reports[key]
                    }
                    var resp = await models.update_data_push(PROFILES_COLLECTION, where ,data)
                    if(!resp){
                        var resp = {
                            status : false,
                            message: 'Unable to Update in DB'
                        }
                        res.status(500);
                        res.json(resp);
                    }         
                }
                var resp = {
                    status : true,
                    message: 'Report Updated '
                }
                res.status(200);
                res.json(resp);
            }
        }else{
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    })
}
exports.get_report = async function (req, res){
    const { body , files} = req;
    await validate_user(body.access_token).then(async (response)=>{
        if(response){    
            var uid = response.uid;
            var phone_number = response.phone_number;  
            let where = {
                _id :ObjectId(body.pid)
            }
            let project = {
                reports : 1
            }
            var resp = await models.get_field(PROFILES_COLLECTION, where ,project)
            if (resp[0].reports) {
                var resp = {
                    status : true,
                    message: 'Reports Found',
                    data : resp[0].reports
                }
                res.status(200);
                res.json(resp);
            }else{
                var resp = {
                    status : false,
                    message: 'No Reports Found '
                }
                res.status(200);
                res.json(resp);
            }
        }else{
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    })
}
exports.update_profile = async function (req, res){
    const { body , files} = req;
    await validate_user(body.access_token).then(async (response)=>{
        if(response){    
            var uid = response.uid;
            var phone_number = response.phone_number;  
            
            let where = {
                _id :ObjectId(body.pid)
            }
            let data = {
                'profile_details.name' : body.name,
                'profile_details.age' : body.age,
                'profile_details.blood_group' : body.blood_group,
                'profile_details.emergency_contact' : body.emergency_contact,
            }
            var resp = await models.update_data_set(PROFILES_COLLECTION, where ,data)
            if(!resp){
                var resp = {
                    status : false,
                    message: 'Unable to Update in DB'
                }
                res.status(500);
                res.json(resp);
            } else{
                var resp = {
                    status : true,
                    message: 'Profile Details Updated '
                }
                res.status(200);
                res.json(resp);
            }
        }else{
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    }) 
}

exports.get_dashboard_data = async function (req, res){
    const { body , files} = req;
    await validate_user(body.access_token).then(async (response)=>{
        if(response){    
            var uid = response.uid;
            var phone_number = response.phone_number;  
            var where = {
                userNumber : phone_number
            }            
            let project = {
                reports : 1,
                profile_details : 1
            }
            var resp = await models.get_field(PROFILES_COLLECTION, where ,project)
            var profile_reports ={};
            for await(var i of Object.keys(resp)){
                let name = resp[i].profile_details.name
                if(name in profile_reports){
                    for await(var j of Object.keys(resp[i].reports)){
                        var OCR = resp[i].reports[j].OCR
                        var uploaded_at = resp[i].reports[j].uploaded_at
                        var test = body.test
                        switch(test){
                            case 'hm' :
                                if (OCR.Haemoglobin) {                                    
                                    let hm = [OCR.Haemoglobin, uploaded_at]
                                    profile_reports[name].push(hm)
                                }
                                break;

                            case 'rbc' :
                                if (OCR.RBC) {      
                                    let RBC = [OCR.RBC, uploaded_at]
                                    profile_reports[name].push(RBC)
                                }
                                break;

                            case 'wbc' :
                                if (OCR.WBC) {  
                                let WBC = [OCR.WBC, uploaded_at]
                                profile_reports[name].push(WBC)
                                }
                                break;

                        }
                    }
                }else{
                    profile_reports[name] = []
                    
                    for await(var j of Object.keys(resp[i].reports)){
                        var OCR = resp[i].reports[j].OCR
                        var uploaded_at = resp[i].reports[j].uploaded_at
                        var test = body.test
                        switch(test){
                            case 'hm' :
                                if (OCR.Haemoglobin) {                                    
                                    let hm = [OCR.Haemoglobin, uploaded_at]
                                    profile_reports[name].push(hm)
                                }
                                break;

                            case 'rbc' :
                                if (OCR.RBC) {      
                                    let RBC = [OCR.RBC, uploaded_at]
                                    profile_reports[name].push(RBC)
                                }
                                break;

                            case 'wbc' :
                                if (OCR.WBC) {  
                                let WBC = [OCR.WBC, uploaded_at]
                                profile_reports[name].push(WBC)
                                }
                                break;

                        }
                    }
                }
            }
            var resp = {
                status : true,
                message: 'Data Found 123',
                data : profile_reports
            }
            res.status(200);
            res.json(resp);
        }else{
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(401);
            res.json(resp);
        }
    })
}