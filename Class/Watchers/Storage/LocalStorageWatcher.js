'use strict'

const LogHandler = require('../../Handlers/Log/LogHandler')
const StorageWatcherBase = require('./StorageWatcherBase')
const chokidar = require('chokidar')

/**
 * This class is supposed to use some StorageInterface instance and watch it for
 *   changes.
 * @since 1.0.0
 * @type {StorageWatcher}
 * @todo: Rewrite this to make use of `StorageInterface` and work for both, local and cloud
 */
module.exports = class LocalStorageWatcher extends StorageWatcherBase {
  /**
   * Constructor
   * @since 1.0.0
   * @param {StorageInterface} StorageInterface
   */
  constructor (StorageInterface) {
    super(StorageInterface)
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
      LogHandler.silly(`Event ${eventName} was emitted: ${path}`)
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