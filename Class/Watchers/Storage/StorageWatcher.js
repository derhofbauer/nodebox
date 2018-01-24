'use strict'

const MessageQueue = require('../../Queues/MessageQueue')
const LogHandler = require('../../Handlers/Log/LogHandler')
const chokidar = require('chokidar')

module.exports = class StorageWatcher {
  constructor (StorageInterface) {
    this.StorageInterface = StorageInterface
    this.MessageQueue = new MessageQueue()
  }

  go () {
    this.startWatcher()
  }

  startWatcher () {
    this._watcher = chokidar.watch(this.StorageInterface.storagePath, {
      persistent: true,
      awaitWriteFinish: true
    })

    this._watcher.on('all', (eventName, path) => {
      LogHandler.debug(`Event ${eventName} was emitted: ${path}`)
    })
    Array.from(['add', 'change', 'addDir', 'unlink', 'unlinkDir']).forEach((event) => {
      this._watcher.on(event, (path) => {
        this.MessageQueue.push({
          event: event,
          path: path
        })
      })
    })

    this._watcher.on('error', (err) => {
      LogHandler.error(err)
      throw new Error(err)
    })

    return this._watcher
  }
}