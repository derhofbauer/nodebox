// deps
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
chai.should()
chai.use(sinonChai)

const MessageQueue = require('../../../Class/Queues/MessageQueue')
const messageQueue = new MessageQueue()

const callback = sinon.spy()
function testFunction (message) {
  callback(message)
}

messageQueue.on('new', () => {
  testFunction(messageQueue.first())
})
messageQueue.on('new', () => {
  testFunction(messageQueue.get())
})
// test
describe('MessageQueue', function () {
  it('should take messages', function (done) {
    messageQueue.push('foobar')
    callback.should.have.been.calledWith('foobar')

    done()
  })

  it('should provide the first message', function (done) {
    messageQueue.push('foobar42')
    callback.should.have.been.calledWith('foobar42')

    done()
  })
})