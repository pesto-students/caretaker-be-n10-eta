
var express = require('express');
var router = express.Router();
var disease = require('../controllers/disease')

router.get('/get-disease', disease.getDisease);
router.post('/add-disease', disease.addDisease);
router.post('/merge-disease', disease.mergeDisease)

module.exports = router;