'use strict'

const LocalStorageWatcher = require('../../Watchers/Storage/LocalStorageWatcher')
const POSITIVE_EVENTS = Array.from(['add', 'change', 'addDir'])
const NEGATIVE_EVENTS = Array.from(['unlink', 'unlinkDir'])

const FileHasher = require('../../Utility/FileHasher')
const LogHandler = require('../../Handlers/Log/LogHandler')

const _ = require('lodash')
const fs = require('../../../Overrides/fs')
const path = require('../../../Overrides/path')
const async = require('async')
const PARALLEL_LIMIT = process.env.PARALLEL_LIMIT || 2

module.exports = class LocalStorageWorker {
  /**
   * Constructor
   * @since 1.0.0
   * @param {StorageInterface} StorageInterface
   * @param {DatabaseInterface} DatabaseInterface
   */
  constructor (StorageInterface, DatabaseInterface) {
    LogHandler.debug(`PARALLEL_LIMIT: ${PARALLEL_LIMIT}`)
    this.StorageInterface = StorageInterface
    this.StorageWatcher = new LocalStorageWatcher(this.StorageInterface)

    this.DatabaseInterface = DatabaseInterface
  }

  /**
   * Starts the whole dang thing ;) by binding event handlers
   */
  go () {
    this.StorageWatcher.go()

    this.q = async.queue(async (item) => {
      this.eventHandler(item)
    }, PARALLEL_LIMIT)

    this.q.drain = () => {
      LogHandler.debug('StorageWorker Work Queue: all items have been processed')
    }

    this.StorageWatcher.MessageQueue.on('new', () => {
      this.q.push(this.StorageWatcher.MessageQueue.first())
    })

    this.removeOldEntries()
  }

  /**
   * Remove file entries to files, that do not exist on disk anymore
   *   This method mocks a filesystem event and makes use of the default
   *   mechanisms for deleting files. It just adds the file path to the async
   *   queue and the StorageWorker routines handle the "event".
   * @since 1.0.0
   */
  removeOldEntries () {
    let index = this.DatabaseInterface.get().value()
    this.StorageInterface.dir().then((files) => {
      _.forEach(index, (value) => {
        if (files.indexOf(value.path_lower) === -1) {
          LogHandler.silly(
            'File does not exist any more and is deleted:',
            files.indexOf(value.path_lower), value.path_lower
          )

          /**
           * Handle the file using the normal routines.
           *   We add an event to the Message Queue here and therefore make use
           *   of the async package again and remove the entry from the db.
           */
          this.StorageWatcher.MessageQueue.push({
            event: 'unlink',
            path: value.path_lower
          })
        }
      })
    })
  }

  /**
   * Handles on single event from StorageWatcher
   * @since 1.0.0
   * @param {object} item Event item: `{event: '…', path: '…')`
   */
  eventHandler (item) {
    if (POSITIVE_EVENTS.indexOf(item.event) > -1) {
      this.handlePositiveEvent(item.path)
    }
    if (NEGATIVE_EVENTS.indexOf(item.event) > -1) {
      this.handleNegativeEvent(item.path)
    }
  }

  /**
   * Handles on single positive event
   * @since 1.0.0
   * @param {string} path Path to handle, might by file or folder path
   * @returns {Promise<object>} Resolves to file or folder object, reject to err
   */
  handlePositiveEvent (path) {
    // (re-)index item.path
    return new Promise((resolve, reject) => {
      this.StorageInterface.stat(path).then((stats) => {
        if (stats.isFile()) {
          this.handlePositiveFile(path, stats)
            .then((file) => {
              resolve(file)
            }).catch((err) => {
              LogHandler.error(err)
              reject(err)
          })
        }

        if (stats.isDirectory()) {
          this.handlePositiveDirectory(path)
            .then((directory) => {
              resolve(directory)
            }).catch((err) => {
              LogHandler.error(err)
              reject(err)
            })
        }
      }).catch((err) => {
        LogHandler.error(err)
        reject(err)
      })
    })
  }

  /**
   * Handles on single negative event
   * @since 1.0.0
   * @param {string} absolutePath Path to handle, might by file or folder path
   * @returns {Promise} Resolves on success, rejects on failure
   */
  handleNegativeEvent (absolutePath) {
    // delete item.path from db
    return new Promise((resolve, reject) => {
      let relativePath = this.getRelativePathFromAbsolute(absolutePath)

      this.DatabaseInterface.removeByPath(relativePath).then(() => {
        LogHandler.silly(`Removing ${relativePath} from database.`)
        resolve()
      }).catch((err) => {
        LogHandler.error(err)
        reject(err)
      })
    })
  }

  /**
   * Handles indexing of one single file
   * @since 1.0.0
   * @param {string} absolutePath Absolute path of current file
   * @param {fs.Stats} stats Current file information
   * @return {Promise<any>} Resolves when file object was successfully added
   * @todo: not only handle local files here but use this.StorageInterface to
   * @todo: get what is required!
   */
  handlePositiveFile (absolutePath, stats) {
    return new Promise((resolve, reject) => {
      let relativePath = this.getRelativePathFromAbsolute(absolutePath)

      this.DatabaseInterface.getByPath(relativePath).then((file) => {
        if (file === undefined  || file.size !== stats.size || file.client_modified !== stats.mtime.toISOString()) {
          LogHandler.verbose(`${relativePath} will be (re-)hashed`)
          new FileHasher(absolutePath).then((hash) => {
            let file = this.prepareFile(relativePath, stats, hash)

            this.DatabaseInterface.addOrUpdateByPath(file).then((file) => {
              resolve(file)
            })

          }).catch((err) => {
            LogHandler.error(err)
            reject(err)
          })
        } else {
          LogHandler.verbose(`${relativePath} will not be hashed`)
        }
      })
    })
  }

  /**
   * Handle indexing of one single directory
   * @since 1.0.0
   * @param {string} absolutePath Absolute path of current file
   * @return {Promise<any>} Resolves when folder object was successfully added
   */
  handlePositiveDirectory (absolutePath) {
    return new Promise((resolve) => {
      let relativePath = this.getRelativePathFromAbsolute(absolutePath)
      let directory = this.prepareDirectory(relativePath)

      this.DatabaseInterface.addOrUpdateByPath(directory).then((directory) => {
        resolve(directory)
      })
    })
  }

  /**
   * Prepares a filelist entry of type file
   * @since 1.0.0
   * @param {string} relativePath Relative path of current file
   * @param {fs.Stats} stats Current file information
   * @param {string} hash Current file hash generated by fileHasher
   * @returns {Object.<tring,(number|string)>} File object
   */
  prepareFile (relativePath, stats, hash) {
    return {
      '.tag': 'file',
      name: path.basename(relativePath),
      path_lower: relativePath.toLowerCase(),
      path_display: relativePath,
      client_modified: stats.mtime,
      size: stats.size,
      content_hash: hash,
      rev: ''
    }
  }

  /**
   * Prepares a filelist entry of type directory
   * @since 1.0.0
   * @param {string} relativePath Relative path of current directory
   * @returns {Object.<string,(string|number)>} Directory object
   */
  prepareDirectory (relativePath) {
    return {
      '.tag': 'folder',
      name: path.basename(relativePath),
      path_lower: relativePath.toLowerCase(),
      path_display: relativePath
    }
  }

  /**
   * Computes a relative path from a given absolute path
   * @since 1.0.0
   * @param {string} absolutePath Absolute path to be resolved
   * @returns {string} Relative path from `absoltuePath`
   */
  getRelativePathFromAbsolute (absolutePath) {
    return path.addLeadingSlash(
      path.relatify(absolutePath, this.StorageInterface.storagePath)
    )
  }

  /**
   * Computes an absolute path from a given relative path
   * @since 1.0.0
   * @param {string} relativePath Relative path to be resolved
   * @returns {string} Absolute path from `relativePath`
   */
  getAbsolutePathFromRelative (relativePath) {
    return path.join(this.StorageInterface.storagePath, relativePath)
  }
}