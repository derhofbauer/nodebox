// deps
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs')
chai.use(chaiAsPromised)

const DATABASE_PATH = '/tmp/testdb.json'
const TEST_FILE = {
  path_lower: 'foobar.test',
  size: 0,
  meta_data: "foo",
  meta_data2: "bar"
}
const DatabaseInterface = require('../../../../Class/Interfaces/Data/DatabaseInterface')
const databaseInterface = new DatabaseInterface(DATABASE_PATH)

describe('DatabaseInterface', function () {
  after(function () {
    fs.unlinkSync(DATABASE_PATH)
  })

  it('should create the database file', function (done) {
    fs.existsSync(DATABASE_PATH)
    done()
  })

  it('should add or update data by given path', function (done) {
    databaseInterface.addOrUpdateByPath(TEST_FILE).should.eventually.deep.equal([TEST_FILE]).and.notify(done)
  })

  it('should return data by given path', function (done) {
    databaseInterface.getByPath(TEST_FILE.path_lower).should.eventually.deep.equal(TEST_FILE).and.notify(done)
  })
})