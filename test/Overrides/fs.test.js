// dependencies
const chai = require('chai')
const expect = chai.expect
const should = chai.should
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

// subject of this test
const fs = require('../../Overrides/fs')

// test
describe('Overrides#fs', function () {
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
    it('shold be an array of strings', function (done) {
      fs.dir('/opt/nodebox/').then((list) => {
        list.every(i => {
          expect(i).to.be.a('string')
        })
        done()
      })
    })
    it('should return the path if a file is given', function (done) {
      expect(fs.dir('/opt/nodebox/index.js')).to.eventually.equal('/opt/nodebox/index.js').and.notify(done)
    })
  })

  describe('stats', function () {
    it('should return fs.Stats on files', function (done) {
      expect(fs.statPromise('/opt/nodebox/index.js')).to.eventually.be.instanceof(fs.Stats).and.notify(done)
    })
    it('should return fs.Stats on directories', function (done) {
      expect(fs.statPromise('/opt/nodebox/')).to.eventually.be.instanceOf(fs.Stats).and.notify(done)
    })
  })
})