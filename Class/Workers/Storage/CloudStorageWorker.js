'use strict'

const CloudStorageWatcher = require('../../Watchers/Storage/CloudStorageWatcher')
const NodeboxEventEmitter = require('../../Emitters/EventEmitter')

const LogHandler = require('../../Handlers/Log/LogHandler')

module.exports = class CloudStorageWorker extends NodeboxEventEmitter {
  constructor (StorageInterface, DatabaseInterface) {
    super()

    this.StorageInterface = StorageInterface
    this.StorageWatcher = new CloudStorageWatcher(this.StorageInterface)

    this.DatabaseInterface = DatabaseInterface

    this.StorageInterface.StorageInterfaceProvider._mq.on('ready', () => {
      this.emit('ready')
    })
  }

  go () {
    this.StorageWatcher.go()
  }
}