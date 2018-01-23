'use strict'

const StorageInterfaceBase = require('./StorageInterfaceBase')
const fs = require('../../../Overrides/fs')

module.exports = class FilesystemStorageInterface extends StorageInterfaceBase {
  constructor (storagePath = '~/nodebox') {
    super()

    this.storagePath = storagePath
  }

  dir () {
    return new Promise((resolve, reject) => {

    })
  }
}