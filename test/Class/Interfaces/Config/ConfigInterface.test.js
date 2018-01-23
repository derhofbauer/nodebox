// dependencies
const chai = require('chai')
const expect = chai.expect;

// subject of this test
const ConfigInterface = require('../../../../Class/Interfaces/Config/ConfigInterface')
const configInterface = new ConfigInterface({
  path: '/.dotfiles/testfolder'
})

// test
describe('ConfigInterface', function () {
  it('should have properties', function (done) {
    expect(configInterface.get('storagePath')).to.equal('/root/nodebox')
    expect(configInterface.get('databasePath')).to.equal('/root/.config/nodebox/db.json')
    expect(configInterface.get('path')).to.equal('/.dotfiles/testfolder')
    done()
  })
})