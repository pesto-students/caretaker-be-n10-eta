require('dotenv').config()
var ObjectId = require('mongodb').ObjectID;
var models = require('../models/models')     
var consts= require('../constants/constants')
const{DATABASE_NAME,PROFILES_COLLECTION,USERS_COLLECTION,DISEASE_COLLECTION}= consts.constants

//Controller to upodate the meetings details of the doctor
exports.doctor_meeting_details = async function (req, res){
    const {access_token, roomName, meetingId,doctor_id } = req.body
    let where = {
        _id  :ObjectId(doctor_id)
      }
    let data = {
        meetingId : meetingId,
        roomName : roomName,
        available : true,
    }
    var resp = await models.update_data_set(USERS_COLLECTION, where ,data)
    resp = {
        status : true,
        data : "Details Updated in DB"
      }
      res.json(resp);
    res.status(200);
}

//Controller to unset the meeting details of doctor when doctor logs out
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
    var resp = await models.update_data_set(USERS_COLLECTION, where ,data)
    resp = {
        status : true,
        data : "Details Updated in DB"
      }
      res.json(resp);
    res.status(200);
}

//Controller to update doctor availibility statuse when user joins meeting
exports.user_join_meetings = async function (req, res){
    const {access_token, doctor_id, user_id } = req.body
    let where = {
        _id  :ObjectId(doctor_id)
      }
    let data = {
        available : false,
    }
    var resp = await models.update_data_set(USERS_COLLECTION, where ,data)
    resp = {
        status : true,
        data : "Details Updated in DB"
      }
      res.json(resp);
    res.status(200);
}

//Controller to update doctor availibility statuse when user leaves meeting
exports.user_leave_meetings = async function (req, res){
    const {access_token, doctor_id, user_id } = req.body
    let where = {
        _id  :ObjectId(doctor_id)
      }
    let data = {
        available : true,
    }
    var resp = await models.update_data_set(USERS_COLLECTION, where ,data)
    resp = {
        status : true,
        data : "Details Updated in DB"
      }
      res.json(resp);
    res.status(200);
}