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
      expect(path.expandTilde('/root')).to.equal('/root')
      done()
    })
  })

  describe('addLeadingSlach', function () {
    it('should add a slash', function (done) {
      expect(path.addLeadingSlash('root/nodebox')).to.equal('/root/nodebox')
      expect(path.addLeadingSlash('/root/nodebox')).to.equal('/root/nodebox')
      done()
    })
  })

  describe('relatify', function () {
    it('should create a filelist', function () {
      expect(path.relatify('/opt/nodebox', '/opt')).to.equal('/nodebox')
    })
  })
})