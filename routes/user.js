
var express = require('express');
var router = express.Router();
var user = require('../controllers/user')

router.post('/updateAccountDetails', user.updateAccountDetails);
router.post('/getUser_details', user.getUser_details);
router.post('/create_profile', user.create_profile);
router.post('/get_profile_list', user.get_profile_list);
router.post('/delete_profile', user.delete_profile);
router.post('/get_emergency_details', user.get_emergency_details);
router.post('/upload_report', user.upload_report);
router.post('/get_report', user.get_report);
router.post('/update_profile', user.update_profile);
router.post('/get_dashboard_data', user.get_dashboard_data);

module.exports = router;
