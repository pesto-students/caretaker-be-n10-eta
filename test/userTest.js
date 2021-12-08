var chai = require('chai')
var assert = chai.assert;

var expect = chai.expect;
var should = chai.should();
var server = require('../index')

let chaiHttp = require('chai-http');
let deepEqualInAnyOrder = require("deep-equal-in-any-order")
const { response } = require('express');
chai.use(chaiHttp)


const testData ={phone_number:"919561901600",access_token:"access-token"}

chai.use(deepEqualInAnyOrder);
describe('get user details' ,  function(){
    it('it should be get Unauthorized access', (done)=>{
        chai.request(server)  
        .post('/getUser_details')
        .send(testData)
        .end((err, response)=>{
            response.should.have.status(200);
            expect(response.body).to.deep.equalInAnyOrder({
                status : false,
                message : "Unauthorized access"
            })
            done();
        })
    })
})

 

