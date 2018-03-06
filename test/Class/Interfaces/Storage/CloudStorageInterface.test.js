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
  it('should be able to access the Dropbox accessToken', function (done) {
    let accessToken = configInterface.get('accessToken')
    expect(cloudStorageInterface.StorageInterfaceProvider.getAccessToken()).to.equal(accessToken)
    done()
  })
  it('should be able to access the last Dropbox Cursor', function (done) {
    let lastCursor = configInterface.get('lastCursor')
    expect(cloudStorageInterface.StorageInterfaceProvider.getLastCursor()).to.equal(lastCursor)
    done()
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
      cloudStorageInterface.stat('/root').should.eventually.be.an('object').and.notify(done)
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
    it('should provide a full file list with metadata', function (done) {
      cloudStorageInterface.StorageInterfaceProvider.getFilelist().then((files) => {
        expect(files).to.be.an('array')
        files.every((value) => {
          expect(value).to.be.an('object')
          expect(value).to.have.property('path_lower')
          expect(value).to.have.property('.tag')
        })
      }).and.notify(done)
    })
  })
})