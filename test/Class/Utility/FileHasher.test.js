// deps
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)

const FileHasher = require('../../../Class/Utility/FileHasher')

// test
describe('FileHasher', function () {
  it('should hash a file', function (done) {
    expect(new FileHasher(__dirname + '/hash_test.txt')).to.eventually.equal('0d1634a2edb3efe45a33cb30286a6737b25d8200bcdb56305a275ddcdace6b4a').and.notify(done)
  })

  it('should reject if a directory is given', function (done) {
    expect(new FileHasher(__dirname)).to.eventually.be.rejectedWith('EISDIR').and.notify(done)
  })

  it('should reject if nonesense is given', function (done) {
    expect(new FileHasher('/foo/bar/hurz.txt')).to.eventually.be.rejected.and.notify(done)
  })
})