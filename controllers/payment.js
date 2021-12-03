require('dotenv').config()
var ObjectId = require('mongodb').ObjectID;
var Razorpay = require('razorpay')
var instance = new Razorpay({key_id: 'rzp_test_9hXnb5iQji6JR7',key_secret: 'QUhQn0GJQFHlaOchiDmYfvIH'});
var models = require('../models/models')     
exports.make_payment = async function (req, res){
    const {doctor_id} = req.body;
    let where = {
      _id :ObjectId(doctor_id)
  }
  let project = {
    doctor_fees : 1,
    user_name : 1
  }
  var doctor = await models.get_field('users', where ,project)
  console.log ('Doctor', doctor)
  let DocFee = doctor[0].doctor_fees * 100
  console.log ('Doctor', DocFee)
    var options = {
        amount: DocFee,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
      };
      instance.orders.create(options, async function(err, order) {
        var resp = await models.insert_data('razorpay_orders', order)
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
    var order_details = await models.get_field('razorpay_orders', where ,project)
    if(order_details[0].amount == payment.amount){
      let where = {
        id :order_id
    }
    let data = await instance.orders.fetch(order_id)
    console.log('data',data);
    var resp = await models.update_data_set('razorpay_orders', where ,data)
      resp = {
        status : true,
        data : "Payment Verified"
      }
      res.status(200);
      res.json(resp);
    }
    
  }
}
