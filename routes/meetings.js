
var express = require('express');
var router = express.Router();
var meeting = require('../controllers/mettings')

router.post('/doctor_meeting_details', meeting.doctor_meeting_details);
router.post('/doctor_unset_meeting', meeting.doctor_unset_meeting);
module.exports = router;