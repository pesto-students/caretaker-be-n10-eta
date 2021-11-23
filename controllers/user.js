require('dotenv').config()
var unlink  =  require('fs').unlink;

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin");
var cloudinary = require('cloudinary');
cloudinary.config({ 
    cloud_name: 'n10eta', 
    api_key: '153456775719431', 
    api_secret: 'YM_yp58wr59ojC76EL4uLn3omtA',
    secure: true
  });
var QRCode = require('qrcode')
// const tesseract = require("node-tesseract-ocr")

var models = require('../models/models')

async function validate_user (access_token){
    var resp;
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

exports.updateAccountDetails = async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        if(response){      
            console.log(response)  
            var uid = response.uid;
            var phone_number = response.phone_number;
            var fileGettingUploaded = req.files.profile_photo;
            var file_url = await upload_file(fileGettingUploaded,'profile_photos' )
            // console.log('file_url', file_url)
            if(file_url){
                MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                    if (err) {
                        console.log('DB error', err);
                    }
                    var _db = db.db('care_tracker')
                    const update = await _db.collection('users').updateOne({
                        "phone_number": phone_number
                    }, {
                        $set: {
                            user_name : req.body.user_name,
                            user_email : req.body.user_email,
                            user_photo : file_url,
                            user_status : 'old'
                        }
                    });
                    console.log('update',uid)
                    var response;
                    if (update.acknowledged) {
                        response = {'status': true}                        
                    }else{
                        response = {
                            status : false,
                            message : "File upload Failed"
                        }
                    }
                    res.json(response);
                })
            }else{                   
                var response = {
                    status : false,
                    message : "File upload Failed"
                }
                res.json(response);
            }
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(403);
            res.json(resp);
            console.log ("in else")
        }
    })

}
exports.getUser_details = async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        console.log('KAPIL',response)
        if(response){        
            var uid = response.uid;
            var phone_number = response.phone_number;
            
            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                if (!err) {
                    console.log('Connected to DB');
                }
                var _db = db.db('care_tracker')
                var search_result;
                const search = await _db.collection("users").findOne({phone_number:phone_number})
                console.log('search result',search)
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
                res.status(200);
                res.json(response);
            })
           
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(403);
            res.json(resp);
            console.log ("in else")
        }
    })

}

exports.create_profile = async function (req, res) {
    var params = JSON.parse(JSON.stringify(req.body));
    console.log ('request params', req.body)
    console.log ('request files', req.files)
    console.log ('reports in body', req.body.reports)
     await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var phone_number = response.phone_number;
            var reports = [];
              if (req.files && Object.keys(req.files).length != 0) {
                if (req.files.reports && Object.keys(req.files.reports).length != 0)
                {

                    console.log(Object.keys(req.files.reports).length, 'reports length')
                    console.log(req.files.reports)
                  for (let index = 0; index < Object.keys(req.files.reports).length; index++) {
                      const file = req.files.reports[index];
                      var file_url = await upload_file(file,'reports')
                      reports.push(file_url);                    
                  }
                }
            }
            
            MongoClient.connect(process.env.MONGO_URL, function(err, db) {
                if (err) throw err;
                var dbData = db.db('care_tracker')
                var obj={
                    name : params.name,
                    age : params.age,
                    blood_group : params.blood_group,
                    disease : params.disease,
                    gender : params.gender,
                    emergency_contact : params.emergency_contact,                    
                }
                //if (req.body.uuid_fb==null){}
                dbData.collection("profiles").insertOne({ user_fb_uid: uid,                 
                    userNumber: phone_number,
                    profile_details :obj,
                    reports : reports, 
                    profile_status : 1, 
                    profile_photo : "",
                    qr_code : ""
                }, 
                function(err, result) {
                    if (err) throw err;

                    if (result.acknowledged) {
                        let insertId = ObjectId(result.insertedId).toString();
                        let filepath = '/tmp/'+insertId+'.png';
                        // QRCode.toDataURL('https://caretracker.netlify.app/emerygencydetails?pid='+insertId, function (err, url) {
                        //     console.log(url)
                        //   })
                        QRCode.toFile(filepath, 'https://caretracker.netlify.app/emerygencydetails?pid='+insertId, {
                            color: {
                              dark: '#00F',  // Blue dots
                              light: '#0000' // Transparent background
                            }
                          }, async function (err) {
                            if (err){
                                console.log(err)                                 
                            } 
                        
                            console.log('QR code generated')
                            var qrlink = await upload_local_file(filepath,'qrcodes') 
                            // console.log (qrlink)
                            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                                var _db = db.db('care_tracker')
                                var ObjectId = require('mongodb').ObjectID;
                                var profile_photo = ""
                                if (req.files && Object.keys(req.files).length != 0) {
                                
                                    if(req.files.profile_photo){
                                        var fileGettingUploaded = req.files.profile_photo;
                                        profile_photo = await upload_file(fileGettingUploaded,'profile_photos' )
                                    }
                                }
                               const update = await _db.collection('profiles').updateOne({
                                "_id": result.insertedId
                                }, {
                                    $set: {
                                        qr_code : qrlink,
                                        profile_photo : profile_photo
                                    }
                                });
                                console.log('QR code generated updated in db')
                                unlink(filepath, (err) => {
                                    if (err) throw err;
                                    console.log('successfully deleted ',filepath);
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
            res.status(403);
            res.json(resp);
            console.log ("in else")
        }
    });
}

exports.get_profile_list = async function (req, res){
    console.log('get_profile_list called')
    console.log ('process.env.MONGO_URL',process.env.MONGO_URL)
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var phone_number = response.phone_number;
            
            MongoClient.connect(process.env.MONGO_URL, async function(err, db) {
                if (err) throw err;                
                var dbData = db.db('care_tracker')
                const insert = await dbData.collection("profiles").find({userNumber: phone_number})
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
               
            });
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(403);
            res.json(resp);
            console.log ("in else")
        }
    });
}

exports.delete_profile = async function (req, res) {
    var params = JSON.parse(JSON.stringify(req.body));
    await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            var profile_id = params.profile_id;
            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                if (!err) {
                    console.log('Connected to DB');
                }
                var _db = db.db('care_tracker')
                // var ObjectId = require('mongodb').ObjectID;
                const deleteP = await _db.collection('profiles').deleteOne(
                    {
                        "_id": ObjectId(profile_id)
                    }
                    
                    );
                    console.log(deleteP);
                    if (deleteP.deletedCount) {
                        
                        var result = {'status': true}
                        res.status(200);
                        res.json(result);
                    }else{
                        var result = {'status': false, message : " Unable to delete"}
                        
                        res.status(200);
                        res.json(result);

                    }
            })
        }else{            
            var resp = {
                status : false,
                message: 'Unauthorized access'
            }
            res.status(403);
            res.json(resp);
            console.log ("in else")
        }
    })
}

exports.get_emergency_details = async function (req, res){    
    var params = JSON.parse(JSON.stringify(req.body));
    var profile_id = params.pid;
    MongoClient.connect(process.env.MONGO_URL,async function (err, db){
        if (!err) {
            console.log('Connected to DB');
        }
        var _db = db.db('care_tracker')
        // var ObjectId = require('mongodb').ObjectID;
        const details = await _db.collection('profiles').findOne(
            {
                "_id": ObjectId(profile_id)
            }
            
            );
            console.log('profile_id',profile_id);
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
    })
       
}

exports.test_insert = async function (req, res){
    var data = {
        hello:'234'
    }
    var resp = await models.insert_data('test',data)
    console.log('req',resp)
}

// exports.test_ocr = async function (req, res){
//     const config = {
//         lang: "eng",
//         oem: 1,
//         psm: 3,
//       }
//     const img =  "https://res.cloudinary.com/n10eta/image/upload/v1637470970/sample_reports/0002_qero1o.jpg"
//     tesseract
//       .recognize(img, config)
//       .then(async (text) => {
//           text1 =await text.replace(/(\r\n|\n|\r)/gm, "\n");
//           var split = text1.split('\n')
//           var filtered = split.filter(function (el) {
//               return el != '' && el != ' ';
//             });
//             var str = 'name';
//             let  rbc =    filtered.filter(function (el) {
//               return el.indexOf( 'Total RBC Count' ) !== -1;;
//             }); //returns 1, because arr[1] == 'foo'
//             let  wbc =    filtered.filter(function (el) {
//               return el.indexOf( 'Total WBC Count' ) !== -1;;
//             }); 
//         // console.log("Total Data:",text)
//         console.log("Filtered Data:",filtered)
//         // console.log("rbc:",rbc)
//         // console.log("wbc:",wbc)
//         // console.log("text1:",split)
//       })
// }