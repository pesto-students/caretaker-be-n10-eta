var chai = require('chai')
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var server = require('../index')

let chaiHttp = require('chai-http');
let deepEqualInAnyOrder = require("deep-equal-in-any-order")
const { response } = require('express');
chai.use(chaiHttp)

describe('user request Disese list' ,  function(){
    it('it should be get all user request The Disease', (done)=>{
        chai.request(server)  
        .get('/get-req-disease')
        .end((err, response)=>{
            response.should.have.status(200);
            response.body?.length?.should.be.equal(2);
            response.body?.should.be.a("object");
            done();
        })
    })
})

 chai.use(deepEqualInAnyOrder);
describe('user request Disese Add' ,  function(){
    it('it should be Request The Disease', (done)=>{
        chai.request(server)  
        .post('/add-req-disease')
        .send({reqDisease :'TestDisease',userName:'pesto'})
        .end((err, response)=>{
            response.should.have.status(200);
            response.body?.length?.should.be.equal(2);
            response.body?.should.be.a('object');
            expect(response.body).to.deep.equalInAnyOrder({
                status : true,
                message : "Add Disease successfully"
            })
            done();
        })
    })
})


describe('user request Disese delete' ,  function(){
    it('it should be delete Request The Disease', (done)=>{
        chai.request(server)  
        .post('/delete-req-disease')
        .send({reqDisease :'TestDisease'})
        .end((err, response)=>{
            response.should.have.status(200);
            expect(response.body).to.deep.equalInAnyOrder({
                status : true,
                message : "Successfully Delete requested Disease"
            })
            done();
        })
    })
}) 