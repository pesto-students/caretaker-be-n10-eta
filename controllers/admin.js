require('dotenv').config()

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
 
var models = require('../models/models')
var consts= require('../constants/constants')
const{DATABASE_NAME,PROFILES_COLLECTION,USERS_COLLECTION,DISEASE_COLLECTION}= consts.constants


exports.getAdminDetails= async  (req, res)=>{
    MongoClient.connect(process.env.MONGO_URL, async function(err, db) {
       if (err) throw err;                
       var dbData = db.db(DATABASE_NAME)
      const countDisease = await dbData.collection(DISEASE_COLLECTION).count()
       const countDoctor = await dbData.collection(USERS_COLLECTION).find({user_type: 'doctor'}).count()
       const countUser = await dbData.collection(USERS_COLLECTION).find({user_type: 'user'}).count()
      let data = {
        'doctor' : countDoctor,
        'users':countUser, 
        'disease': countDoctor
      }
      const stats = [
        { title: "Users", count: countUser, id: 0 },
        { title: "Doctors", count: countDoctor, id: 1 },
        { title: "Disease", count: 15, id: 2 },
      ];
       var response = {'status': true,'data':stats }
       res.json(response); 
       db.close();      
   });
}
