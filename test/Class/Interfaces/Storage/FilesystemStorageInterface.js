// deps
const chai = require('chai')
const expect = chai.expet
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const FilesysteStorageInterface = require('../../../../Class/Interfaces/Storage/FilesystemStorageInterface')
const filesystemStorageInterface = new FilesysteStorageInterface('~/.config/nodebox')

// test
describe('FilesystemStorageInterface', function () {
  it('should return an array', function (done) {
    filesystemStorageInterface.dir().should.eventually.be.an('array').and.notify(done)
  })
})