require('dotenv').config()
var ObjectId = require('mongodb').ObjectID;
var models = require('../models/models')     
exports.doctor_meeting_details = async function (req, res){
    const {access_token, roomName, meetingId,doctor_id } = req.body
    console.log('meeting Details', doctor_id)
    let where = {
        _id  :ObjectId(doctor_id)
      }
    let data = {
        meetingId : meetingId,
        roomName : roomName,
        available : false,
    }
    var resp = await models.update_data_set('users', where ,data)
    resp = {
        status : true,
        data : "Details Updated in DB"
      }
      res.json(resp);
    res.status(200);
}

exports.doctor_unset_meeting = async function (req, res){
    const {access_token, doctor_id } = req.body
    console.log('meeting Details', doctor_id)
    let where = {
        _id  :ObjectId(doctor_id)
      }
    let data = {
        meetingId : '',
        roomName : '',
        available : false,
    }
    var resp = await models.update_data_set('users', where ,data)
    resp = {
        status : true,
        data : "Details Updated in DB"
      }
      res.json(resp);
    res.status(200);
}