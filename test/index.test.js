// dependencies
const chai = require('chai')
const expect = chai.expect;

const Nodebox = require('../Class/Controllers/Nodebox')

// subject of this test
const index = require('../index')

// test
describe('Index', function () {
  it('should return Nodebox instance', function (done) {
    expect(index).to.be.instanceOf(Nodebox)
    done()
  })
})