'use strict'

const LogHandler = require('../Handlers/Log/LogHandler')

module.exports = class MergeWorker {
  constructor (LocalStorageWorker, CloudStorageWorker) {
    this.LocalStorageWorker = LocalStorageWorker
    this.CloudStorageWorker = CloudStorageWorker

    this._ready = {
      local: false,
      cloud: false
    }

    this.LocalStorageWorker.on('ready', () => {
      this._ready.local = true
      this.go()
    })

    this.CloudStorageWorker.on('ready', () => {
      this._ready.cloud = true
      this.go()
    })
  }

  go () {
    if (this._ready.local === true && this._ready.cloud === true) {
      LogHandler.debug('MergeWorker started!')
    }
  }
}