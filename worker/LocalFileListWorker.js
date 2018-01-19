'use strict'

const chokidar = require('chokidar')
const _ = require('lodash')
const fs = require('../util/fs')
const path = require('../util/path')

const FileHasher = require('../util/fileHasher')
const FileListWorkerBase = require('../class/FileListWorkerBase')

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
module.exports = class LocalFileListWorker extends FileListWorkerBase {

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
    super(dbx, eventEmitter)

    this.db = db

    if (startIndexingOnCreation === true) {
      this.index().then(() => {
        this.startWatcher()
      })
    }
    this.filelist = []

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
   * @returns {Promise<any>} Resolves on successful index, rejects on error
   */
  index () {
    console.debug('LocalFileListWorker:index')

    return new Promise((resolve, reject) => {
      if (!this._indexing) {
        this._indexing = true

        this.buildRecursiveFileList().then(() => {
          this.persistFilelist()
            .then(() => {
              this._em.emit('localWorker:ready')
              resolve()
            })
        }).catch((err) => {
          console.log(err)
          reject()
        })
      }
    })
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
      console.log(`Initial scan complete, watcher is now ready!`)
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

      this._em.emit('localWorker:indexing:start')

      fs.dir(this.db.getSettings('storagePath')).then((files) => {

        files.forEach((absolutePath, index, collection) => {
          this.handleDirResult(absolutePath)
            .then(() => {
              if (index === collection.length - 1) {
                this._em.emit('localWorker:indexing:done')
                resolve(this.filelist)
              }
            }).catch((err) => {
              this._em.emit('localWorker:indexing:error')
              reject(err)
            })
        })

      })
    })
  }

  /**
   * Handles one single item from local indexing process
   * @param {string} absolutePath Path to handle
   * @returns {Promise<any>} Resolves when item has been handled successfully,
   *   rejects on error
   */
  handleDirResult(absolutePath) {
    return new Promise((resolve, reject) => {
      let stats = fs.statSyncError(absolutePath)

      // is file
      if (stats.isFile()) {
        this.handleFile(absolutePath, stats)
          .then((file) => {
            resolve(file)
          }).catch((err) => {
            reject(err)
          })
      }

      // is directory
      if (stats.isDirectory()) {
        this.handleDirectory(absolutePath, stats)
          .then((directory) => {
            resolve(directory)
          }).catch((err) => {
            reject(err)
          })
      }

      // is something else, which would be very weird
      if (!stats.isFile() && !stats.isDirectory()) {
        reject(new Error(`Error: Path ${absolutePath} is not a file or directory.`))
      }
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
   * @return {Promise<any>} Resolves when all operations are done successfully
   */
  persistFilelist () {
    console.debug('LocalFileListWorker:persistFilelist')

    return new Promise((resolve, reject) => {
      this.mergePersistedWithTmpIndex()
        .then(() => {
          return this.removeDeletedFilesFromIndex()
        })
        .then(() => {
          return this.removeDuplicatesFromIndex()
        })
        .then(() => {
          resolve()
        }).catch((err) => {
          console.log(err)
          reject(err)
      })

      this._indexing = false
    })
  }

  /**
   * Merges currently indexed entries into persisted file list entries
   * @since 1.0.0
   * @returns {Promise<any>} Always resolves after last iteration
   */
  mergePersistedWithTmpIndex () {
    return new Promise((resolve) => {
      this.filelist.forEach((file, index, collection) => {
        // merge persisted index with currently index files
        let persistedEntry = this.db.getIndexLocal().find({path_lower: file.path_lower}).value()

        if (persistedEntry) {
          let _merged = _.merge(persistedEntry, file)
          this.db.getIndexLocal().find({path_lower: file.path_lower}).assign(_merged).write()
        } else {
          this.db.getIndexLocal().push(file).write()
        }

        if (index === collection.length - 1) {
          resolve(this.getFileList())
        }
      })
    })
  }

  /**
   * Removes files from persisted index, that do not live on local disk anymore
   * @since 1.0.0
   * @returns {Promise<any>} Always resolves after last iteration
   */
  removeDeletedFilesFromIndex () {
    return new Promise((resolve) => {
      // check stored index for paths that do not exist anymore in storage folder
      this.db.getIndexLocal().value().forEach((file, index, collection) => {
        let _path = this.getAbsolutePathFromRelative(file.path_display)

        if (!fs.existsSync(_path)) {
          this.db.getIndexLocal().remove({path_display: file.path_display}).write()
        }

        if (index === collection.length - 1) {
          resolve(this.getFileList())
        }
      })
    })
  }

  /**
   * Removes duplicate entries from persisted file list; uses deep compare
   * @since 1.0.0
   * @returns {Promise<any>} Always resolves after new list is persisted
   */
  removeDuplicatesFromIndex () {
    return new Promise((resolve) => {
      let _tmp = _.sortBy(this.db.getIndexLocal().value(), 'path_lower')
      _tmp.forEach((element, index) => {
        if (_.isEqual(element, _tmp[index - 1])) {
          _tmp.splice(index, 1)
        }
      })
      this.db.setIndexLocal(_tmp)

      resolve(this.getFileList())
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
   * Handles indexing of one single file
   * @since 1.0.0
   * @param {string} absolutePath Absolute path of current file
   * @param {fs.Stats} stats Current file information
   * @return {Promise<any>} Resolves when file object was successfully added
   */
  handleFile (absolutePath, stats) {
    return new Promise((resolve, reject) => {
      new FileHasher(absolutePath).then((hash) => {
        let relativePath = this.getRelativePathFromAbsolute(absolutePath)
        let file = this.prepareFile(relativePath, stats, hash)
        this.filelist.push(file)
        resolve(file)
      }).catch((err) => {
        console.log(err)
        reject(err)
      })
    })
  }

  /**
   * Handle indexing of one single directory
   * @since 1.0.0
   * @param {string} absolutePath Absolute path of current file
   * @return {Promise<any>} Resolves when folder object was successfully added
   */
  handleDirectory (absolutePath) {
    return new Promise((resolve) => {
      let relativePath = this.getRelativePathFromAbsolute(absolutePath)
      let directory = this.prepareDirectory(relativePath)
      console.debug('Directory:', directory)
      this.filelist.push(directory)
      resolve(directory)
    })
  }

  /**
   * Returns the local file list
   * @since 1.0.0
   * @returns {Array.<Object>} Local file list
   */
  getFileList () {
    return this.db.getIndexLocal()
  }
}
