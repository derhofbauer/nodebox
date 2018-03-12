// deps
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs')
chai.use(chaiAsPromised)

const DATABASE_PATH = '/tmp/testdb.json'
var TEST_FILE = {
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
  
  it('should add data by given path and return object', function (done) {
    databaseInterface.addOrUpdateByPath(TEST_FILE).should.eventually.deep.equal(TEST_FILE).and.notify(done)
  })

  it('should update data by given path and return object', function (done) {
    let data = {
      path_lower: 'foobar.test',
      size: 42,
      meta_data: "foo",
      meta_data2: "bar"
    }

    let file = databaseInterface.get().find({path_lower: data.path_lower})
    // console.log('--------')
    // console.log(file.value())
    // console.log('--------')

    databaseInterface.addOrUpdateByPath(data).should.eventually.deep.equal(data).and.notify(done)
  })

  it('should return data by given path', function (done) {
    databaseInterface.getByPath(TEST_FILE.path_lower).should.eventually.deep.equal(TEST_FILE).and.notify(done)
  })

  it('should return a single value', function (done) {
    expect(databaseInterface.getValue('foobar')).to.equal(undefined)
    done()
  })

  it('should return the whole database', function (done) {
    let state = databaseInterface.getState()
    expect(state).to.be.a('Object')
    expect(state).to.have.property('index')
    done()
  })

  it('should return the db itself', function (done) {
    expect(databaseInterface.getDb()).to.be.an('Object')
    done()
  })
})