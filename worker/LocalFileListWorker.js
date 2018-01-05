'use strict'

const fs = require('../util/fs')
const path = require('../util/path')

const FileHasher = require('../util/fileHasher')

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

  index () {
    console.log('LocalFileListWorker:index')

    if (!this._indexing) {
      this._indexing = true

      this.buildRecursiveFileList().then(() => {
        this.persistFilelist()
      })
    }
  }

  startWatcher () {
    console.debug('LocalFileListWorker:startWatcher')
    this._watcher = fs.watch(this.db.getSettings('storagePath'), {}, (eventType, filename) => {
      console.log('filesystem event:', eventType, 'on', filename)
      this.index()
    })
  }

  getWatcher () {
    return this._watcher
  }

    /**
     * @todo: Refactor to cleaner code!
     */
  buildRecursiveFileList () {
    console.log('LocalFileListWorker:buildRecursiveFileList')
    return new Promise((resolve, reject) => {
      let files = fs.walkSync(this.db.getSettings('storagePath'))
      files.forEach((absolutePath, index, files) => {
        let relativePath = this.getRelativePathFromAbsolute(absolutePath)
        let stats = fs.statSyncError(absolutePath)

        // is file
        if (stats.isFile()) {
          new FileHasher(absolutePath).then((hash) => {
            let file = this.prepareFile(relativePath, stats, hash)
            this.filelist.push(file)

            if (index === files.length - 1) {
              resolve(this.filelist)
            }
          }).catch((err) => {
            console.log(err)
          })
        }
        if (stats.isDirectory()) {
          // is directory
          let directory = this.prepareDirectory(relativePath)
          console.debug('Directory:', directory)
          this.filelist.push(directory)

          if (index === files.length - 1) {
            resolve(this.filelist)
          }
        }
        if (!stats.isFile() && !stats.isDirectory()) {
          reject(new Error(`Error: Path ${absolutePath} is not a file or directory.`))
        }
      })
    })
  }

  getRelativePathFromAbsolute (absolutePath) {
    return path.addLeadingSlash(
            path.removeStaticFragment(absolutePath, this.db.getSettings('storagePath'))
        )
  }

  getRelativePathFromAbsoluteDropbox (absolutePath) {
    return this.db.getSettings('path') + this.getRelativePathFromAbsolute(absolutePath)
  }

  getAbsolutePathFromRelative (relativePath) {
    return path.join(this.db.getSettings('storagePath'), relativePath)
  }

  isDirectory (relativePath) {
    return fs.statSync(relativePath).isDirectory()
  }

  persistFilelist () {
    console.log('LocalFileListWorker:persistFilelist')
    this.db.setIndexLocal(this.filelist)

    this._indexing = false
  }

  isIndexing () {
    return this._indexing
  }

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

  prepareDirectory (relativePath) {
      return {
          '.tag': 'folder',
          name: path.basename(relativePath),
          path_lower: relativePath.toLowerCase(),
          path_display: relativePath
      }
  }
}
