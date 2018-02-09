// dependencies
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

// subject of this test
const fs = require('../../Overrides/fs')

// test
describe('Overrides#fs', function () {
  describe('pathExists', function () {
    it('should check path asynchronously', function (done) {
      expect(fs.pathExists('/bin/pwd')).to.eventually.equal(true)
      expect(fs.pathExists('/hurz/foobar')).to.eventually.equal(false)
      done()
    })
  })

  describe('mkdirIfNotExists', function () {
    after(function () {
      fs.rmdir('/opt/nodebox/testfolder')
    })

    it('should create a directory', function (done) {
      expect(fs.mkdirIfNotExists('/root/hurz')).to.eventually.be.rejected
      expect(fs.mkdirIfNotExists('/opt/nodebox/testfolder')).to.eventually.be.fulfilled
      done()
    })
  })

  describe('dir', function () {
    it('should create a filelist', async function () {
      await expect(fs.dir('/opt/nodebox/')).to.eventually.be.an('array')
      await expect(fs.dir('/opt/nodebox/index.js')).to.eventually.be.a('string')
    })
  })

  describe('stats', function () {
    it('should return stats', async function () {
      await expect(fs.statPromise('/opt/nodebox/index.js')).to.eventually.be.an('object')
      await expect(fs.statPromise('/opt/nodebox/index.js')).to.eventually.be.instanceof(fs.Stats)
    })
  })
})