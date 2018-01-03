'use strict'

const fs = require('../util/fs')
const path = require('../util/path')

const _ = require('lodash')

/**
 * @todo: file watcher needs to listen for certain events and handle them. When a file is changed or a new file is
 * @todo: created by the downloadWorker module, it needs to be indexed.
 */
module.exports = class LocalFileListWorker {

  constructor (dbx, db, startIndexingOnCreation) {
    this.dbx = dbx
    this.db = db

    this.filelist = []

    if (startIndexingOnCreation === true) {
      this.index()
    }
    this.startWatcher()

    this._indexing = false
  }

  /**
   * @todo: build a list similar to the list from the Dropbox API containing timestamps and file hashes.
   */
  index () {
    console.log('LocalFileListWorker:index')

    if (!this._indexing) {
      this._indexing = true

      this.buildRecursiveFileList()

      this.persistFilelist()
    }
  }

  startWatcher () {
    console.log('LocalFileListWorker:startWatcher')
    this._watcher = fs.watch(this.db.getSettings('storagePath'), {}, (eventType, filename) => {
      console.log('filesystem event:', eventType, 'on', filename)
      this.index()
    })
  }

  getWatcher () {
    return this._watcher
  }

  buildRecursiveFileList () {
    console.log('LocalFileListWorker:buildRecursiveFileList')
    this.filelist = _.map(fs.walkSync(this.db.getSettings('storagePath')), (value) => {
      return this.getRelativePathFromAbsolute(value)
    })

    return this.filelist
  }

  getRelativePathFromAbsolute (absolutePath) {
    return path.removeStaticFragment(absolutePath, this.db.getSettings('storagePath'))
  }

  getAbsolutePathFromRelative (relativePath) {
    return path.join(this.db.getSettings('storagePath'), relativePath)
  }

  isDirectory (relativePath) {
    return fs.statSync(relativePath).isDirectory()
  }

  persistFilelist () {
    this.db.setIndexLocal(this.filelist)

    this._indexing = false
  }

  isIndexing () {
    return this._indexing
  }
}
