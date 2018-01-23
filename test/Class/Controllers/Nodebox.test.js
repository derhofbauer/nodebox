// dependencies
const chai = require('chai')
const expect = chai.expect;

// subject of this test
const Nodebox = require('../../../Class/Controllers/Nodebox')
const nodebox = new Nodebox()

// test
describe('Nodebox', function () {
  describe('#properties', function () {
    it('should have a few properties', function (done) {
      expect(nodebox).to.have.property('CloudStorageInterface')
      expect(nodebox).to.have.property('FilesystemStorageInterface')
      expect(nodebox).to.have.property('MessageQueue')
      expect(nodebox).to.have.property('UploadWorker')
      expect(nodebox).to.have.property('DownloadWorker')
      expect(nodebox).to.have.property('DatabaseInterface')
      expect(nodebox).to.have.property('ConfigInterface')
      expect(nodebox).to.have.property('ErrorHandler')
      expect(nodebox).to.have.property('LogHandler')
      expect(nodebox).to.have.property('EventEmitter')
      done()
    })
  })
})