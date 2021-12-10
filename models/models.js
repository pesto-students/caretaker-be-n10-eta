
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

//Function to insert data in collection
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
    dbcon.close();
    return response
}

//function to add new data to collection
exports.update_data_push =  async function (collection_name, where , data, operation){
    var response;
    var _db
    var dbcon = await MongoClient.connect(process.env.MONGO_URL);
    var db = dbcon.db('care_tracker')
    // console.log(db, 'asasas');
    const update = await db.collection(collection_name).updateOne(where, {
        $push: data
    });
    console.log('update', update);
    if (update.acknowledged) { 
        response =true; 
    } else {
        response = false;
    }
    dbcon.close();
    return response
}

//Function to update data set in a collection 
exports.update_data_set =  async function (collection_name, where , data){
    var response;
    var _db
    var dbcon = await MongoClient.connect(process.env.MONGO_URL);
    var db = dbcon.db('care_tracker')
    // console.log(db, 'asasas');
    const update = await db.collection(collection_name).updateOne(where, {
        $set: data
    });
    console.log('update', update);
    if (update.acknowledged) { 
        response =true; 
    } else {
        response = false;
    }
    dbcon.close();
    return response
}

//Function to fetch data from collection on the basis of collection name and feilds projection
exports.get_field =  async function (collection_name, where , project){
    console.log('where', where);
    var response;
    var _db
    var dbcon = await MongoClient.connect(process.env.MONGO_URL);
    var db = dbcon.db('care_tracker')
    // console.log(db, 'asasas');
    const find = await db.collection(collection_name)
    .find(where)
    .project(project)
    .toArray();
    // console.log('find', find);
    if (find) { 
        response =find; 
    } else {
        response = false;
    }
    dbcon.close();
    return find
}


