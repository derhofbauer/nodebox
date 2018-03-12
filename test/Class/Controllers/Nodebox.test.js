// dependencies
const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const path = require('path')

// subject of this test
const Nodebox = require('../../../Class/Controllers/Nodebox')
const nodebox = new Nodebox()

// test
describe('Nodebox', function () {
  describe('#properties', function () {
    it('should have a few properties', function (done) {
      expect(nodebox).to.have.property('CloudStorageInterface')
      expect(nodebox).to.have.property('MessageQueue')
      expect(nodebox).to.have.property('UploadWorker')
      expect(nodebox).to.have.property('DownloadWorker')
      expect(nodebox).to.have.property('DatabaseInterface')
      expect(nodebox).to.have.property('ConfigInterface')
      expect(nodebox).to.have.property('ErrorHandler')
      expect(nodebox).to.have.property('EventEmitter')
      done()
    })
  })

  describe('.setup', function () {
    before (function () {
      fs.rename(path.expandTilde('~/.config/nodebox/config.json'), path.expandTilde('~/.config/nodebox/config.json.test'), (err) => {
        if (err) throw err
      })
    })

    after (function () {
      fs.rename(path.expandTilde('~/.config/nodebox/config.json.test'), path.expandTilde('~/.config/nodebox/config.json'), (err) => {
        if (err) throw err
      })
    })

    it('should always resolve', function (done) {
      expect(nodebox.setup()).to.eventually.be.fulfilled.and.notify(done)
    })
  })

  describe('.promptForConfig', function () {
    it('should resolve', function (done) {

    })
  })
})