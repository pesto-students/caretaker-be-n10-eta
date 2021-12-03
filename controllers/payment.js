require('dotenv').config()
const { RAZORPAY_CONFIG } = process.env;
var Razorpay = require('razorpay')
var instance = new Razorpay({key_id: 'rzp_test_9hXnb5iQji6JR7',key_secret: 'QUhQn0GJQFHlaOchiDmYfvIH'});
exports.make_payment = async function (req, res){
    const {body} = req;
    // console.log('body',body)
    var options = {
        amount: 50000,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
      };
      instance.orders.create(options, function(err, order) {
        console.log(order);
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