
var express = require('express');
var router = express.Router();
var disease = require('../controllers/reqDisease')

router.get('/get-req-disease', reqDisease.getReqDisease);
router.post('/add-req-disease', reqDisease.addReqDisease);

module.exports = router;