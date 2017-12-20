'use strict'

// const errorHandler = require('../util/errorHandler')
const configFile = require('../util/configFile')
const fs = require('../util/fs')
const path = require('../util/path')

const _ = require('lodash')

module.exports = class LocalFileListWorker {
  constructor (dbx, storagePath, dbPath, startIndexingOnCreation) {
    this.dbx = dbx
    this.storagePath = storagePath
    this.dbPath = dbPath

    this.filelist = []

    if (startIndexingOnCreation === true) {
      this.index()
    }
    this.startWatcher()

    this._indexing = false
  }

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
    this._watcher = fs.watch(this.storagePath, {}, (eventType, filename) => {
      console.log('filesystem event:', eventType, 'on', filename)
      this.index()
    })
  }

  getWatcher () {
    return this._watcher
  }

  buildRecursiveFileList () {
    console.log('LocalFileListWorker:buildRecursiveFileList')
    this.filelist = _.map(fs.walkSync(this.storagePath), (value, index) => {
      return this.getRelativePathFromAbsolute(value)
    })

    return this.filelist
  }

  getRelativePathFromAbsolute (absolutePath) {
    return path.removeStaticFragment(absolutePath, this.storagePath)
  }

  getAbsolutePathFromRelative (relativePath) {
    return path.join(this.storagePath, relativePath)
  }

  isDirectory (relativePath) {
    return fs.statSync(relativePath).isDirectory()
  }

  persistFilelist () {
    configFile.writeConfigFile(this.dbPath, this.filelist)

    this._indexing = false
  }

  isIndexing () {
    return this._indexing
  }
}
