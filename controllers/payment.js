require('dotenv').config()


exports.make_payment = async function (req, res){
    const {body} = req;
    console.log('body',body)
}