var chai = require('chai')
var assert = chai.assert;

var expect = chai.expect;
var should = chai.should();
var server = require('../index')

let chaiHttp = require('chai-http');
let deepEqualInAnyOrder = require("deep-equal-in-any-order")
const { response } = require('express');
chai.use(chaiHttp)

describe('Disese list' ,  function(){
    it('it should be get all The Disease', (done)=>{
        chai.request(server)  
        .get('/get-disease')
        .end((err, response)=>{
            response.should.have.status(200);
            response.body?.length?.should.be.equal(1);
            response.body?.should.be.a("object");
            done();
        })
    })
})

 chai.use(deepEqualInAnyOrder);
describe('Disese Add' ,  function(){
    it('it should be Add The Disease', (done)=>{
        chai.request(server)  
        .post('/add-disease')
        .send({disease :'testDataDisease'})
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

 describe('Disese Delete' ,  function(){
    it('it should be Delete The Disease', (done)=>{
        chai.request(server)  
        .post('/delete-disease')
        .send({disease :'testDataDisease'})
        .end((err, response)=>{
            response.should.have.status(200);
            expect(response.body).to.deep.equalInAnyOrder({
                status : true,
                message : "Successfully Delete Disease"
            })
            done();
        })
    })
})

describe('Merge the user request Disese' ,  function(){
    it('it should be Add The Disease', (done)=>{
        chai.request(server)  
        .post('/merge-disease')
        .send({disease :'testDataDisease',mergeDisease: 'ResolveDisease'})
        .end((err, response)=>{
            response.should.have.status(200);
            expect(response.body).to.deep.equalInAnyOrder({
                status : true,
                message : "Successfully Merge Disease"
            })
            done();
        })
    })
})
