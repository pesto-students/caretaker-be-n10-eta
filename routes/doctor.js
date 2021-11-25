
var express = require('express');
var router = express.Router();

var doctor = require('../controllers/doctor')

router.get('/get-doctors', doctor.getDoctors);
router.post('/doctor-add', doctor.doctorAdd);

module.exports = router;