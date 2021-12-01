require('dotenv').config()

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
// var admin = require("firebase-admin");
// var cloudinary = require('cloudinary');

// cloudinary.config({ 
//     cloud_name: 'n10eta', 
//     api_key: '153456775719431', 
//     api_secret: 'YM_yp58wr59ojC76EL4uLn3omtA',
//     secure: true
//   });

var models = require('../models/models')


exports.getAdminDetails= async  (req, res)=>{
    MongoClient.connect(process.env.MONGO_URL, async function(err, db) {
       if (err) throw err;                
       var dbData = db.db('care_tracker')
      // {user_type: 'doctor'}
      const countDisease = await dbData.collection("disease").count()
       const countDoctor = await dbData.collection("users").find({user_type: 'doctor'}).count()
       const countUser = await dbData.collection("users").find({user_type: 'user'}).count()
      
       var response = {'status': true, 'doctor' : countDoctor, 'users':countUser, 'disease': countDisease}
       res.json(response); 
       db.close();      
   });
}