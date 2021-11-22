
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
exports.insert_data =  async function (collection_name, data){
    var response;
    var _db
    var dbcon = await MongoClient.connect(process.env.MONGO_URL);
    var db = dbcon.db('care_tracker')
    // console.log(db, 'asasas');
    const insert = await db.collection(collection_name).insertOne(data);
    console.log('insert', insert);
    if (insert.acknowledged) {
        response = insert.insertedId;
        console.log('insert', response);
    } else {
        response = false;
    }
    return response
}
