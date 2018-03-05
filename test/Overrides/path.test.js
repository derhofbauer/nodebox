// dependencies
const chai = require('chai')
const expect = chai.expect

// subject of this test
const path = require('../../Overrides/path')

// test
describe('Overrides#path', function () {
  describe('expandTilde', function () {
    it('should expand ~', function (done) {
      expect(path.expandTilde('~/nodebox')).to.equal('/root/nodebox')
      done()
    })
    it('should do nothing when no ~ is given', function (done) {
      expect(path.expandTilde('/root')).to.equal('/root')
      done()
    })
  })

  describe('addLeadingSlash', function () {
    it('should add a slash', function (done) {
      expect(path.addLeadingSlash('root/nodebox')).to.equal('/root/nodebox')
      done()
    })
    it('should not add two slashes', function (done) {
      expect(path.addLeadingSlash('/root/nodebox')).to.equal('/root/nodebox')
      done()
    })
  })

  describe('relatify', function () {
    it('should create a relative path', function (done) {
      expect(path.relatify('/opt/nodebox', '/opt')).to.equal('/nodebox')
      done()
    })
    it('should do nothing on relative paths', function (done) {
      expect(path.relatify('opt/nodebox', '/opt')).to.equal('opt/nodebox')
      done()
    })
    it('should not corrupt paths', function (done) {
      expect(path.relatify('/some/weird/path', '/foobar')).to.equal('/some/weird/path')
      done()
    })
  })
})