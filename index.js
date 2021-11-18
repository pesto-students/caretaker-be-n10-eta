require('dotenv').config()
const app = require('./api/index');
var server = app.listen(process.env.PORT || 8081, function () {
    var host = server.address().address
    var port = server.address().port    
    console.log("Care Tracker listening at http://%s:%s", host, port)
})


