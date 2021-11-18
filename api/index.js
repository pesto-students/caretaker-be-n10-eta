require('dotenv').config()
var express = require('express');
var multer = require('multer');
var cors = require("cors");
var fileUpload = require('express-fileupload');
var upload = multer();
var admin = require("firebase-admin");
var serviceAccount = require("../caretracker-16078-firebase-adminsdk-zm8yx-a2d439dc7c.json");
var cloudinary = require('cloudinary');
var QRCode = require('qrcode')
cloudinary.config({ 
    cloud_name: 'n10eta', 
    api_key: '153456775719431', 
    api_secret: 'YM_yp58wr59ojC76EL4uLn3omtA',
    secure: true
  });
var unlink  =  require('fs').unlink;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(upload.array()); 
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Login api, that will recive FIrebase access token 
// and verify it with firebase admin sdk

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
    await cloudinary.uploader.upload(file.tempFilePath,  function(error, result) {console.log(error, result); file_url = error.url}, {
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
async function insert_data (collection_name, data){
    var response;
    var dbcon = await MongoClient.connect(process.env.MONGO_URL);
    // MongoClient.connect(process.env.MONGO_URL, async function (err, db) {
    //     if (!err) {
    //         var _db = db.db('care_tracker');
    //         const insert = await _db.collection(collection_name).insertOne(data);
    //         if (insert.acknowledged) {
    //             response = insert.insertedId;
    //             console.log(response);
    //         } else {
    //             response = false;
    //         }
    //         db.close();
    //     }
    // });
    console.log(dbcon, 'asasas');
    return response
}
app.post('/login',function (req, res) {   
    var params = JSON.parse(JSON.stringify(req.body));
    // console.log(test)
    admin.auth()
    .verifyIdToken(params.access_token)
    .then((decodedToken) => {
        const uid = decodedToken.uid;
        console.log ('FB res', decodedToken)
        MongoClient.connect(process.env.MONGO_URL,async function (err, db){
            if (!err) {
                console.log('Connected to DB');
                var _db = db.db('care_tracker')
                var search_result = true;
                const search = await _db.collection("users").findOne({'phone_number' :decodedToken.phone_number}, async function(err, result) {
                    if (err) throw err;
                    console.log(result);
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
        console.log('error', error.errorInfo)
        var response = {
            status : false
        }
        res.json(response);
    });
    // res.json(req.body);
            
})

app.post('/updateAccountDetails', async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        console.log('KAPIL',response)
        if(response){        
            var uid = response.uid;
            var fileGettingUploaded = req.files.profile_photo;
            var file_url = await upload_file(fileGettingUploaded,'profile_photos' )
            console.log('file_url', file_url)
            if(file_url){
                MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                    if (!err) {
                        console.log('Connected to DB');
                    }
                    var _db = db.db('care_tracker')
                    const update = await _db.collection('users').updateOne({
                        "user_fb_uid": uid
                    }, {
                        $set: {
                            user_name : req.body.user_name,
                            user_email : req.body.user_email,
                            user_photo : file_url,
                            user_status : 'old'
                        }
                    });
                    console.log('update',update)
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

})

app.post('/getUser_details', async function (req, res){
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        console.log('KAPIL',response)
        if(response){        
            var uid = response.uid;
            
            MongoClient.connect(process.env.MONGO_URL,async function (err, db){
                if (!err) {
                    console.log('Connected to DB');
                }
                var _db = db.db('care_tracker')
                var search_result;
                const search = await _db.collection("users").findOne({user_fb_uid:uid})
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

})

app.get('/', async function (req, res) {
    // user_details = {
    //     name : 'akshay'
    // }
    // var insert = await insert_data('test', user_details);
    // console.log(insert);
    res.send('Welcome to Care Tracker Backend CI/CD')
})

app.post('/create_profile', async function(req, res) {
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
                    gender : params.disease,
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
})

app.post('/get_profile_list', async function(req, res) {
    var params = JSON.parse(JSON.stringify(req.body));
     await validate_user(params.access_token).then(async (response)=>{
        if(response){        
            var uid = response.uid;
            
            MongoClient.connect(process.env.MONGO_URL, async function(err, db) {
                if (err) throw err;                
                var dbData = db.db('care_tracker')
                const insert = await dbData.collection("profiles").find({user_fb_uid: uid})
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
})

app.post('/delete_profile', async function(req, res) {
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
});

app.post('/get_emergency_details', async function(req, res) {    
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
            console.log(details);
            if (details) {
                
                var result = {'status': true,
                                data : details}
                res.status(200);
                res.json(result);
            }else{
                var result = {'status': false, message : " No details found"}
                
                res.status(200);
                res.json(result);

            }
    })
       
});
    
module.exports = app;



