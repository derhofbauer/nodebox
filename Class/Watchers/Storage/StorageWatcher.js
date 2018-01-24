'use strict'

const MessageQueue = require('../../Queues/MessageQueue')
const LogHandler = require('../../Handlers/Log/LogHandler')
const chokidar = require('chokidar')

/**
 * This class is supposed to use some StorageInterface instance and watch it for
 *   changes.
 * @since 1.0.0
 * @type {StorageWatcher}
 */
module.exports = class StorageWatcher {
  /**
   * Constructor
   * @since 1.0.0
   * @param {StorageInterface} StorageInterface
   */
  constructor (StorageInterface) {
    this.StorageInterface = StorageInterface
    this.MessageQueue = new MessageQueue()
  }

  /**
   * Starts the whole dang thing ;)
   * @since 1.0.0
   */
  go () {
    this.startWatcher()
  }

  /**
   * Starts the watcher and handles file system events
   * @since 1.0.0
   * @returns {*} chokidar instance
   */
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