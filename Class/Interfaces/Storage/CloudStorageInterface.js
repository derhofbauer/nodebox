'use strict'

const StorageInterfaceBase = require('./StorageInterfaceBase')

module.exports = class CloudStorageInterface extends StorageInterfaceBase {
  constructor (StorageInterfaceProvider) {
    super()
    this.StorageInterfaceProvider = StorageInterfaceProvider
  }

  dir () {
    return this.StorageInterfaceProvider.dir()
  }

  stat (path) {
    return this.StorageInterfaceProvider.stat(path)
  }
}