var chai = require('chai')
var assert = chai.assert;

var expect = chai.expect;
var should = chai.should();
var server = require('../index')

let chaiHttp = require('chai-http');
const { response } = require('express');
chai.use(chaiHttp)

describe('Disese list' ,  function(){
    it('it should be get admin Dashboard Data', (done)=>{
        chai.request(server)  
        .get('/get-admin')
        .end((err, response)=>{
            response.should.have.status(200);
            response.body?.length?.should.be.equal(3);
            response.body?.should.be.a("object");
            done();
        })
    })
})