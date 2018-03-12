'use strict'

const StorageWatcherBase = require('./StorageWatcherBase')

module.exports = class CloudStorageWatcher extends StorageWatcherBase {
  constructor (StorageInterface) {
    super(StorageInterface)
  }

  startWatcher () {
    this.StorageInterface.StorageInterfaceProvider.go()
  }
}