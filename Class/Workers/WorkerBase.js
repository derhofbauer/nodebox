'use strict'

const MessageQueue = require('../Queues/MessageQueue')

module.exports = class WorkerBase {
  constructor (LocalStorageWorker, CloudStorageWorker) {
    this.LocalStorageWorker = LocalStorageWorker
    this.CloudStorageWorker = CloudStorageWorker

    this.MessageQueue = new MessageQueue()

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
}