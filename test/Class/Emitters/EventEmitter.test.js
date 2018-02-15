// deps
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
chai.should()
chai.use(sinonChai)

const EventEmitter = require('../../../Class/Emitters/EventEmitter')
const eventEmitter = new EventEmitter()

function testFunction(data, cb) {
  cb(data)
}

eventEmitter.on('testEvent', testFunction)

// test
describe('EventEmitter', function () {
  it('should be an object', function (done) {
    expect(eventEmitter).to.be.an('object')
    done()
  })

  it('should emit events', function (done) {
    let cb = sinon.spy()
    let data = 'testData'

    eventEmitter.emit('testEvent', data, cb)
    cb.should.have.been.calledWith('testData')

    eventEmitter.emit('testEvent', {foo: 'bar'}, cb)
    cb.should.have.been.calledWith({foo: 'bar'})

    done()
  })
})