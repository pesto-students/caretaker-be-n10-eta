require('dotenv').config()
var ObjectId = require('mongodb').ObjectID;
var Razorpay = require('razorpay')
const {RAZORPAY_SECRET, RAZORPAY_KEY} = process.env
var instance = new Razorpay({key_id: RAZORPAY_KEY,key_secret: RAZORPAY_SECRET});
var models = require('../models/models')  
var consts= require('../constants/constants')
const{DATABASE_NAME,PROFILES_COLLECTION,USERS_COLLECTION,DISEASE_COLLECTION,RAZORPAY_ORDERS_COLLECTION}= consts.constants
//Function to initiate a payment
exports.make_payment = async function (req, res){
  const {doctor_id} = req.body;
  let where = {
    _id :ObjectId(doctor_id)
  }
  let project = {
    doctor_fees : 1,
    user_name : 1
  }
  var doctor = await models.get_field(USERS_COLLECTION, where ,project)
  console.log ('Doctor', doctor)
  let DocFee = doctor[0].doctor_fees * 100
  console.log ('Doctor', DocFee)
  var options = {
    amount: DocFee,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, async function(err, order) {
    var resp = await models.insert_data(RAZORPAY_ORDERS_COLLECTION, order)
    console.log('resp', resp)
    resp = {
      status : true,
      data : {
        order_id : order.id,
        amount : order.amount,
        all_data : order
      }
    }
    
    res.status(200);
    res.json(resp);
  });
}

//Function to verify payment details on succesful payment
exports.payment_success = async function (req, res){
  const {orderCreationId,razorpayOrderId,razorpayPaymentId,razorpaySignature} = req.body
  let payment = await instance.payments.fetch(razorpayPaymentId)
  console.log (payment)
  if (payment.status == 'captured') {
    order_id = payment.order_id;
    let where = {
      id :order_id
    }
    let project = {
      amount : 1
    }
    var order_details = await models.get_field(RAZORPAY_ORDERS_COLLECTION, where ,project)
    if(order_details[0].amount == payment.amount){
      let where = {
        id  :order_id
      }
      let data = await instance.orders.fetch(order_id)
      console.log('data',data);
      var resp = await models.update_data_set(RAZORPAY_ORDERS_COLLECTION, where ,data)
      resp = {
        status : true,
        data : "Payment Verified"
      }
      res.status(200);
      res.json(resp);
    }
    
  }
}