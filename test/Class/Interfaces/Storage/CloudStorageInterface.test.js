// deps
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const ConfigInterface = require('../../../../Class/Interfaces/Config/ConfigInterface')
const configInterface = new ConfigInterface({
  path: '/.dotfiles/testfolder'
})

const CloudStorageProvider = require('../../../../Class/Interfaces/Storage/Provider/DropboxStorageInterfaceProvider')
const CloudStorageInterface = require('../../../../Class/Interfaces/Storage/CloudStorageInterface')
const cloudStorageInterface = new CloudStorageInterface(
  new CloudStorageProvider(
    configInterface
  )
)

describe('DropboxStorageInterfaceProvider', function () {
  // before(function () {
  //   cloudStorageInterface.StorageInterfaceProvider.fetchFilesListFolder()
  // })

  it('should be able to access the Dropbox accessToken', function (done) {
    let accessToken = configInterface.get('accessToken')
    expect(cloudStorageInterface.StorageInterfaceProvider.getAccessToken()).to.equal(accessToken)
    done()
  })
  describe('.getLastCursor()', function () {
    it('should be able to access the last Dropbox Cursor', function (done) {
      let lastCursor = configInterface.get('lastCursor')
      expect(cloudStorageInterface.StorageInterfaceProvider.getLastCursor()).to.equal(lastCursor)
      done()
    })
    it('should never be empty', function () {
      expect(cloudStorageInterface.StorageInterfaceProvider.getLastCursor()).to.have.lengthOf.above(0)
    })
  })
  it('should be able to access the Dropbox path', function (done) {
    let path = configInterface.get('path')
    expect(cloudStorageInterface.StorageInterfaceProvider.getPath()).to.equal(path)
    done()
  })

  describe('.dir()', function () {
    it('should return a recursive file list with full relative paths', function (done) {
      cloudStorageInterface.dir().should.eventually.be.an('array').and.notify(done)
    })
  })

  describe('.stat()', function () {
    it('should return stats', function (done) {
      cloudStorageInterface.stat('/.dotfiles').should.eventually.be.an('object').and.notify(done)
    })
    it('should reject, when path is not found', function (done) {
      cloudStorageInterface.stat('/foo/bar').should.eventually.be.rejected.and.notify(done)
    })
  })

  describe('.Provider', function () {
    it('should provide default parameters for Dropbox requests', function (done) {
      let params = cloudStorageInterface.StorageInterfaceProvider.getDefaultParams()
      expect(params).to.be.an('object')
      expect(params).to.have.property('path')
      expect(params).to.have.property('recursive')
      done()
    })

    describe('.fetchFilesListFolder', function () {
      it('should return an array of objects', function (done) {
        cloudStorageInterface.StorageInterfaceProvider.fetchFilesListFolder().should.eventually.be.an('array').and.notify(done)
      })
      it('should provide a full file list with metadata', function () {
        return cloudStorageInterface.StorageInterfaceProvider.fetchFilesListFolder().then((files) => {
          files.every((value) => {
            expect(value).to.be.an('object')
            expect(value).to.have.property('path_lower')
            expect(value).to.have.property('.tag')
          })
        })
      })
    })
  })
})