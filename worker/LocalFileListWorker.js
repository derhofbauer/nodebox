'use strict'

const errorHandler = require('../util/errorHandler')
const configFile = require('../util/configFile')
const fs = require('../util/fs')
const path = require('../util/path')

const _ = require('lodash')

module.exports = class LocalFileListWorker {

    constructor (dbx, storagePath, dbPath, start_indexing_on_creation) {
        this.dbx = dbx
        this.storagePath = storagePath
        this.dbPath = dbPath

        this.filelist = []

        if (start_indexing_on_creation === true) {
            this.index()
        }
        this.startWatcher()

        this._indexing = false
    }

    index () {
        this._indexing = true

        if (!this._indexing) {
            console.log('LocalFileListWorker:index')
            this.buildRecursiveFileList()

            this.persistFilelist()
        }
    }

    startWatcher () {
        console.log('LocalFileListWorker:startWatcher')
        this._watcher = fs.watch(this.storagePath, {}, (eventType, filename) => {
            console.log("filesystem event:", eventType, "on", filename)
            this.index()
        })
    }

    getWatcher() {
        return this._watcher
    }

    buildRecursiveFileList () {
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

    isIndexing() {
        return this._indexing
    }

}