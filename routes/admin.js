var express = require('express');
var router = express.Router();
var admin = require('../controllers/admin')

router.get('/get-admin',admin.getAdminDetails)

module.exports = router;