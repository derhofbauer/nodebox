'use strict'

const chokidar = require('chokidar')
const fs = require('../util/fs')
const path = require('../util/path')

const FileHasher = require('../util/fileHasher')
const FileListWorker = require('../class/FileListWorker')

/**
 * This module provides a worker class to index the local storage path and keep
 *   the index updated by listening to certain filesystem events.
 *
 * @todo: file watcher needs to listen for certain events and handle them.
 * @todo: When a file is changed or a new file is created by the downloadWorker
 * @todo: module, it needs to be indexed.
 *
 * @type {module.LocalFileListWorker}
 * @since 1.0.0
 */
module.exports = class LocalFileListWorker extends FileListWorker {

  /**
   * Create local file list and start listener.
   * @since 1.0.0
   * @param {Dropbox} dbx Dropbox SDK instance
   * @param {Lowdb} db LowDB instance
   * @param {NodeboxEventEmitter} eventEmitter EventEmitter Instance
   * @param {boolean} startIndexingOnCreation Whether to start creating an index
   *   on instantiation.
   */
  constructor (dbx, db, eventEmitter, startIndexingOnCreation = true) {
    this.dbx = dbx
    this.db = db

    /**
     * EventEmitter
     * @member {NodeboxEventEmitter}
     */
    this._em = eventEmitter

    this.filelist = []

    if (startIndexingOnCreation === true) {
      this.index()
    }
    this.startWatcher()

    /**
     * Indexing switch; true when indexing, false when idle
     * @member {boolean}
     */
    this._indexing = false

    /**
     * File system watcher
     * @member {chokidar}
     */
    this._watcher = null
    this._watcherReady = false
  }

  /**
   * Builds recursive file list and handles indexing switch.
   * @since 1.0.0
   */
  index () {
    console.debug('LocalFileListWorker:index')

    if (!this._indexing) {
      this._indexing = true

      this.buildRecursiveFileList().then(() => {
        this._em.emit('localWorker:ready')
        this.persistFilelist()
      })
    }
  }

  /**
   * Starts a filesystem event listener using `fs.watch`.
   *
   * @todo: handle filesystem events correctly and do stuff other than logging it!
   *
   * @since 1.0.0
   * @returns {fs.FSWatcher} File system watcher
   */
  startWatcher () {
    console.debug('LocalFileListWorker:startWatcher')
    this._watcher = chokidar.watch(this.db.getSettings('storagePath'), {
      persistent: true,
      awaitWriteFinish: true
    })
    this._watcher.on('ready', () => {
      console.debug(`Initial scan complete, watcher is now ready!`)
      this._watcherReady = true
    })
    this._watcher.on('all', (eventName, path) => {
      console.debug(`Event ${eventName} was emitted on ${path}.`)
    })
    this._watcher.on('error', (err) => {
      throw new Error(err)
    })

    return this._watcher
  }

  /**
   * Returns the listener
   * @since 1.0.0
   * @returns {fs.FSWatcher} File system watcher
   */
  getWatcher () {
    return this._watcher
  }

  /**
   * Builds a recursive file list of this.db.settings.storagePath
   * @since 1.0.0
   * @returns {Promise} Resolves when last item was added to this.filelist,
   *   rejects when an entry is neither a file nor a directory.
   */
  buildRecursiveFileList () {
    console.debug('LocalFileListWorker:buildRecursiveFileList')
    return new Promise((resolve, reject) => {
      let files = fs.walkSync(this.db.getSettings('storagePath'))
      files.forEach((absolutePath, index, collection) => {
        let stats = fs.statSyncError(absolutePath)

        // is file
        if (stats.isFile()) {
          this.handleFile(absolutePath, stats, index, collection, resolve)
        }
        // is directory
        if (stats.isDirectory()) {
          this.handleDirectry(absolutePath, index, collection, resolve)
        }
        if (!stats.isFile() && !stats.isDirectory()) {
          reject(new Error(`Error: Path ${absolutePath} is not a file or directory.`))
        }
      })
    })
  }

  /**
   * Computes a relative path from a given absolute path
   * @since 1.0.0
   * @param {string} absolutePath Absolute path to be resolved
   * @returns {string} Relative path from `absoltuePath`
   */
  getRelativePathFromAbsolute (absolutePath) {
    return path.addLeadingSlash(
            path.relatify(absolutePath, this.db.getSettings('storagePath'))
        )
  }

  /**
   * Computes an absolute path from a given absolute path as it is assumed to be
   *   on Dropbox and would be returned by the API like this
   * @since 1.0.0
   * @param {string} absolutePath Absolute path to be resolved
   * @returns {string} Absolute path on Dropbox
   */
  getDropboxPathFromAbsolute (absolutePath) {
    return this.db.getSettings('path') + this.getRelativePathFromAbsolute(absolutePath)
  }

  /**
   * Computes an absolute path from a given relative path
   * @since 1.0.0
   * @param {string} relativePath Relative path to be resolved
   * @returns {string} Absolute path from `relativePath`
   */
  getAbsolutePathFromRelative (relativePath) {
    return path.join(this.db.getSettings('storagePath'), relativePath)
  }

  /**
   * Persists the computed filelist using this.db persisting methods.
   * @since 1.0.0
   */
  persistFilelist () {
    console.debug('LocalFileListWorker:persistFilelist')
    this.db.setIndexLocal(this.filelist)

    this._indexing = false
  }

  /**
   * Returns current indexing status.
   * @since 1.0.0
   * @returns {boolean} True when indexing, false when idle
   */
  isIndexing () {
    return this._indexing
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
      content_hash: hash
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
   * Handles indexing of one single file
   * @since 1.0.0
   * @param {string} absolutePath Absolute path of current file
   * @param {fs.Stats} stats Current file information
   * @param {number} index Index of current iteration
   * @param {Array.<string>} files The array we are currently iterating over
   * @param {function} resolve The parent promise's resolve method
   */
  handleFile (absolutePath, stats, index, files, resolve) {
    new FileHasher(absolutePath).then((hash) => {
      let relativePath = this.getRelativePathFromAbsolute(absolutePath)
      let file = this.prepareFile(relativePath, stats, hash)
      this.filelist.push(file)

      if (index === files.length - 1) {
        resolve(this.filelist)
      }
    }).catch((err) => {
      console.log(err)
    })
  }

  /**
   * Handle indexing of one single directory
   * @since 1.0.0
   * @param {string} absolutePath Absolute path of current file
   * @param {number} index Index of current iteration
   * @param {Array.<string>} files The array we are currently iterating over
   * @param {function} resolve The parent promise's resolve method
   */
  handleDirectry (absolutePath, index, files, resolve) {
    let relativePath = this.getRelativePathFromAbsolute(absolutePath)
    let directory = this.prepareDirectory(relativePath)
    console.debug('Directory:', directory)
    this.filelist.push(directory)

    if (index === files.length - 1) {
      resolve(this.filelist)
    }
  }

  /**
   * Returns the local file list
   * @since 1.0.0
   * @returns {Array.<Object>} Local file list
   */
  getFileList () {
    return this.filelist
  }
}
