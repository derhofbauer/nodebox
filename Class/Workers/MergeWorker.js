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

      // this.LocalStorageWorker.StorageInterface.dir().then((dir) => {
      //   console.log('Local:', dir)
      // })
      // this.CloudStorageWorker.StorageInterface.dir().then((dir) => {
      //   console.log('Cloud:', dir)
      // })

      /**
       * + get differences for both local and server filelist and handle those
       *     files.
       * + for all other files, that live locally and remote, check hashes and
       *     download metadata (id, rev, etc.) if hashes are identical. In case
       *     they are not identical, handle the conflict.
       */
    }
  }
}