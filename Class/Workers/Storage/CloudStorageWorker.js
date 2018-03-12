'use strict'

const CloudStorageWatcher = require('../../Watchers/Storage/CloudStorageWatcher')

const LogHandler = require('../../Handlers/Log/LogHandler')

module.exports = class CloudStorageWorker {
  constructor (StorageInterface, DatabaseInterface) {
    this.StorageInterface = StorageInterface
    this.StorageWatcher = new CloudStorageWatcher(this.StorageInterface)

    this.DatabaseInterface = DatabaseInterface
  }

  go () {
    this.StorageWatcher.go()
  }
}