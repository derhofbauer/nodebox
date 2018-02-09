'use strict'

const StorageInterfaceBase = require('./StorageInterfaceBase')
const fs = require('../../../Overrides/fs')
const path = require('../../../Overrides/path')
const _ = require('lodash')

module.exports = class FilesystemStorageInterface extends StorageInterfaceBase {
  constructor (storagePath = '~/nodebox') {
    super()

    this.storagePath = path.expandTilde(storagePath)
  }

  dir (relative = true) {
    return new Promise((resolve, reject) => {
      fs.dir(this.storagePath).then((files) => {
        if (relative === true) {
          let returns = _.map(files, (value) => {
            return path.relatify(value, this.storagePath)
          })
          resolve(returns)
        }
        resolve(files)
      }).catch((err) => {
        LogHandler.error(err)
        reject(err)
      })
    })
  }
}