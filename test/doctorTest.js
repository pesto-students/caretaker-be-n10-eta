var chai = require('chai')
var assert = chai.assert;

var expect = chai.expect;
var should = chai.should();
var server = require('../index')

let chaiHttp = require('chai-http');
let deepEqualInAnyOrder = require("deep-equal-in-any-order")
const { response } = require('express');
chai.use(chaiHttp)

describe('Get Doctor' ,  function(){
    it('it should be get all The Doctors', (done)=>{
        chai.request(server)  
        .get('/get-doctors')
        .end((err, response)=>{
            response.should.have.status(200);
            response.body?.length?.should.be.equal(1);
            response.body?.should.be.a("object");
            done();
        })
    })
})

const testData ={phone_number:"919561901600",user_name:"Dr ABCDE",
                doctor_expertise :"MBBS ",doctor_experience:4,doctor_fees :50}

chai.use(deepEqualInAnyOrder);
describe('Add Doctor' ,  function(){
    it('it should be added doctor', (done)=>{
        chai.request(server)  
        .post('/doctor-add')
        .send(testData)
        .end((err, response)=>{
            response.should.have.status(200);
            expect(response.body).to.deep.equalInAnyOrder({
                status : false,
                message : "Invalid data"
            })
            done();
        })
    })
})

 

