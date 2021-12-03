
var express = require('express');
var router = express.Router();
var payment = require('../controllers/payment')

router.post('/make_payment', payment.make_payment);
module.exports = router;