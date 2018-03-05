/*
// deps
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
chai.should()
chai.use(sinonChai)

const fs = require('fs')

const StorageWatcher = require('../../../../Class/Watchers/Storage/StorageWatcher')
const FilesystemStorageInterface = require('../../../../Class/Interfaces/Storage/FilesystemStorageInterface')

const filesystemStorageInterface = new FilesystemStorageInterface('/tmp/nodeboxTmp')
const storageWatcher = new StorageWatcher(filesystemStorageInterface)

const callback = sinon.spy()
storageWatcher.MessageQueue.on('add', callback)

// test
describe('StorageWatcher', function () {
  it('should trigger on filesystem events', function (done) {
    storageWatcher.go()

    callback.should.have.been.calledWith('add', '/root/.config/nodebox/config.json')
    done()
  })
})*/
