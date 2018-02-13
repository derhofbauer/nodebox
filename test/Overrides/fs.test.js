// dependencies
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

// subject of this test
const fs = require('../../Overrides/fs')

// test
describe('Overrides#fs', function () {
  /*describe('pathExists', function () {
    it('should check path asynchronously (exists)', function (done) {
      expect(fs.pathExists('/bin/pwd')).to.eventually.equal(true).and.notify(done)
    })
    it('should check path asynchronously (not exists)', function (done) {
      expect(fs.pathExists('/hurz/foobar')).to.eventually.equal(false).and.notify(done)
    })
  })*/

  describe('mkdirIfNotExists', function () {
    after(function () {
      fs.rmdirSync('/opt/nodebox/123456789')
    })

    it('should create a directory', function (done) {
      expect(fs.mkdirIfNotExists('/opt/nodebox/123456789')).to.eventually.be.fulfilled.and.notify(done)
    })
  })

  describe('dir', function () {
    it('should create a filelist', function (done) {
      expect(fs.dir('/opt/nodebox/')).to.eventually.be.an('array').and.notify(done)
    })
    it('should return the path if a file is given', function (done) {
      expect(fs.dir('/opt/nodebox/index.js')).to.eventually.be.a('string').and.notify(done)
    })
  })

  describe('stats', function () {
    it('should return fs.Stats', function (done) {
      expect(fs.statPromise('/opt/nodebox/index.js')).to.eventually.be.instanceof(fs.Stats).and.notify(done)
    })
  })
})