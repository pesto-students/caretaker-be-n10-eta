require('dotenv').config()
var loginRouter = require('./routes/login');
var userRouter = require('./routes/user');
var doctorRouter = require('./routes/doctor');
var diseaseRouter = require('./routes/disease');
var reqDiseaseRouter = require('./routes/reqDisease');
var adminRouter = require('./routes/admin')

// const app = require('./api/index');
var express = require('express');
var fileUpload = require('express-fileupload');

var cors = require("cors");
var multer = require('multer');
var upload = multer();
var app = express();
app.use(express.urlencoded({ extended: true, }));
// app.use(upload.array()); 
app.use(cors());
app.use(express.json());
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));
app.use('/', loginRouter);
app.use('/', userRouter);
app.use('/',doctorRouter);
app.use('/',diseaseRouter);
app.use('/',reqDiseaseRouter);
app.use('/',adminRouter)
var server = app.listen(process.env.PORT || 8081, function () {
    var host = server.address().address
    var port = server.address().port    
    console.log("Care Tracker listening at http://%s:%s", host, port)
})


