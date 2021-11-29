
var express = require('express');
var router = express.Router();
var reqDisease = require('../controllers/reqDisease')

router.get('/get-req-disease', reqDisease.getReqDisease);
router.post('/add-req-disease', reqDisease.addReqDisease);
router.post('/delete-req-disease', reqDisease.deleteReqDisease);


module.exports = router;