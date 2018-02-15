// deps
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
chai.should()
chai.use(sinonChai)

const LogHandler = require('../../../../Class/Handlers/Log/LogHandler')

// test
describe('LogHandler', function () {
  it('should log without errors', function (done) {
    LogHandler.log('log test')
    LogHandler.info('info test')
    LogHandler.verbose('verbose test')
    LogHandler.silly('silly test')
    LogHandler.debug('debug test')
    LogHandler.warn('warn test')
    LogHandler.error('error test')
    done()
  })
})