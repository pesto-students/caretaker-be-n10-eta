
var express = require('express');
var router = express.Router();

var login = require('../controllers/login')

router.get('/', login.index);
router.post('/login', login.login);

module.exports = router;
