'use strict'

const StorageInterfaceBase = require('./StorageInterfaceBase')
const fs = require('../../../Overrides/fs')
const path = require('../../../Overrides/path')
const _ = require('lodash')

const LogHandler = require('../../Handlers/Log/LogHandler')

module.exports = class FilesystemStorageInterface extends StorageInterfaceBase {
  constructor (storagePath = '~/nodebox') {
    super()

    this.storagePath = path.expandTilde(storagePath)
  }

  /**
   * Returns a file list with relative paths
   * @param {bool} relative create relative paths or absolute
   * @returns {Promise<Array|Object>} Resolves to Array, rejects to errorg
   */
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

  /**
   * Calls the fs.statPromise() Method on the given path and returns the promise
   * @param {string} path Path to stat
   * @returns {Promise<object>} Resolves on success with stats,
   *   rejects with error
   */
  stat (path) {
    return fs.statPromise(path)
  }
}