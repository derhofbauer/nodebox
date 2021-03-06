'use strict'

const WorkerBase = require('./WorkerBase')
const LogHandler = require('../Handlers/Log/LogHandler')
const fs = require('../../Overrides/fs')
const path = require('../../Overrides/path')
const _ = require('lodash')
const async = require('async')
const https = require('https')

const PARALLEL_LIMIT = process.env.PARALLEL_LIMIT || 2

/**
 * @todo This Class should only merge metadata of existing files.
 *   UploadWorker and DownloadWorker need to generate their queues on
 *   their own and handle them - no need for a worker handling other
 *   workers!
 * @todo This Class needs to provide a message queue for UploadWorker and
 *   DownloadWorker to push events to, when they finished transfering a
 *   file.
 */
module.exports = class MergeWorker extends WorkerBase {
  constructor (LocalStorageWorker, CloudStorageWorker, DatabaseInterface) {
    super(LocalStorageWorker, CloudStorageWorker)

    this.DatabaseInterface = DatabaseInterface
    this.dbx = this.CloudStorageWorker.StorageInterface.StorageInterfaceProvider.dbx

    this.q = async.queue(async (event) => {
      if (event.type === 'merge') {
        this.dispatchMetadataMerge(event.path)
      }
      if (event.type === 'down') {
        this.handleDownload(event.path)
      }
      if (event.type === 'up') {
        this.handleUpload(event.path)
      }
    }, PARALLEL_LIMIT)

    this.q.drain = () => {
      LogHandler.debug('MergeWorker Work Queue: all items have been processed')
    }
  }

  go () {
    if (this._ready.local === true && this._ready.cloud === true) {
      LogHandler.debug('MergeWorker started!')

      // this.LocalStorageWorker.StorageInterface.dir().then((dir) => {
      //   console.log('Local:', dir)
      // })
      // this.CloudStorageWorker.StorageInterface.dir().then((dir) => {
      //   console.log('Cloud:', dir)
      // })

      /**
       * for all other files, that live locally and remote, check hashes and
       *     download metadata (id, rev, etc.) if hashes are identical. In case
       *     they are not identical, handle the conflict.
       */
      this.LocalStorageWorker.StorageInterface.dir().then((dirL) => {
        this.CloudStorageWorker.StorageInterface.dir().then((dirS) => {
          let onlyLocal = dirL.filter(x => !dirS.includes(x))
          // console.log(onlyLocal)
          // this.dispatchLocalFiles(onlyLocal)
          this.handleDownload('/.dotfiles')

          let onlyServer = dirS.filter(x => !dirL.includes(x))
          onlyServer.forEach((value) => {
            this.q.push({
              type: 'down',
              path: value
            })
          })

          let intersection = _.intersection(dirL, dirS)
          // console.log(intersection)

          intersection.forEach((value) => {
            this.q.push({
              type: 'merge',
              path: value
            })
          })
        })
      })
    }
  }

  /**
   * @todo NEEDS TESTING
   * @todo NEEDS REFACTORING
   * @todo NEEDS TO BE THOUGHT ABOUT AGAIN!!
   * @param path
   */
  dispatchMetadataMerge (path) {
    this.CloudStorageWorker.StorageInterface.stat(path).then((cloudFile) => {
      this.DatabaseInterface.getByPath(path).then((localFile) => {
          // console.log("path:", path)
          // console.log("stat:", cloudFile)
          // console.log("meta:", localFile)
        if (localFile['.tag'] === 'folder') {
          this.handleFolderMetadataMerge(localFile, cloudFile, path)
        }

        if (localFile['.tag'] === 'file') {
          this.handleFileMetadataMerge(localFile, cloudFile, path)
        }
      })
    })
  }

  handleFolderMetadataMerge (localFile, cloudFile, path) {
    if (localFile.id === undefined) {
      LogHandler.silly(`Folder ${path} will be updated in the database with API data`)
      let merged = _.merge(localFile, cloudFile)
      this.DatabaseInterface.addOrUpdateByPath(merged).then((newFolder) => {
        LogHandler.silly(`Folder ${path} updated`, newFolder)
      })
    } else {
      LogHandler.silly(`Folder ${path} ignored, already identical on both ends.`)
    }
  }

  handleFileMetadataMerge (localFile, cloudFile, path) {
    if (this.metadataCanBeSynced(localFile, cloudFile)) {
      if (!this.metadataDeepEquals(localFile, cloudFile)) {
        LogHandler.silly(`File ${path} will be updated in the database with API data`)
        localFile = this.mergeMetadataObjects(localFile, cloudFile)
        this.DatabaseInterface.addOrUpdateByPath(localFile).then((newFile) => {
          LogHandler.silly(`File ${path} updated`, newFile)
        })
      } else {
        LogHandler.silly(`File ${path} ignored, already identical on both ends.`)
      }
    } else {
      LogHandler.silly(`File ${path} does not exist yet and will be downloaded with a new name`)
      // download but rename
    }
  }

  handleDownload (path) {
    LogHandler.silly(`MergeWorker: handle download of ${path}`)
    /**
     * + check if path does not exist locally, in order to avoid errors
     * + if path does not exist on disk:
     *   + download metadata and check if path is file or folder
     *   + download file or create folder
     *   + add metadata entry to database
     */
    console.log(path)
    this.CloudStorageWorker.StorageInterface.stat(path).then((metadata) => {
      let absolutePath = this.LocalStorageWorker.getAbsolutePathFromRelative(path)
      if (metadata['.tag'] === 'folder') {
        fs.mkdirIfNotExists(absolutePath).then(() => {
          LogHandler.debug(`${path} created`)
        }).catch((err) => {
          LogHandler.error(err)
          throw new Error(err)
        })
      }
      if (metadata['.tag'] === 'file') {
        this.downloadFileStream(path, absolutePath).then((response) => {
          if (response.error_summary) {
            LogHandler.error(response.error_summary)
          } else {
            this.DatabaseInterface.addOrUpdateByPath(response).then((newFile) => {
              console.log("##", response)
            })
          }
        }).catch((err) => {
          LogHandler.error(err)
          throw err
        })
      }
    }).catch((err) => {
      LogHandler.error(err)
    })
  }

  /**
   * Streams a file from the Dropbox API to a local file
   * based upon https://github.com/dropbox/dropbox-sdk-js/issues/139#issuecomment-308444157
   * @since 1.0.0
   * @param {string} pathOnDropbox
   * @param {string} absoluteFilesystemPath Path to store the downloaded file to
   * @returns {Promise<any>} Resolves on success, rejects on error
   */
  downloadFileStream (pathOnDropbox, absoluteFilesystemPath) {
    return new Promise ((resolve, reject) => {
      this.dbx.filesGetTemporaryLink({
        path: pathOnDropbox
      }).then((result) => {
        LogHandler.silly(`Attempting to download ${pathOnDropbox}`)
        let req = https.get(result.link, (res) => {
          res.pipe(fs.createWriteStream(path.resolve(absoluteFilesystemPath), {flags: 'wx'}))
        })
        req.on('close', () => {
          resolve(result.metadata)
        })
        req.on('error', (error) => {
          LogHandler.error(error)
          reject(error)
        })
      }).catch((err) => {
        LogHandler.error(err)
        reject(err)
      })
    })
  }

  handleUpload (path) {

  }

  /**
   * merge metadata objects
   * @param {object} localFile Metadata object from local database
   * @param {object} cloudFile Metadata object from Dropbox API
   * @returns {object} merged Metadata object
   */
  mergeMetadataObjects (localFile, cloudFile) {
    localFile.id = cloudFile.id
    localFile.server_modified = cloudFile.server_modified
    localFile.rev = cloudFile.rev

    return localFile
  }

  metadataCanBeSynced (localFile, cloudFile) {
    return (
        localFile.size === cloudFile.size &&
        localFile.content_hash === cloudFile.content_hash
    )
  }
  metadataDeepEquals (localFile, cloudFile) {
    if (
        localFile.name === cloudFile.name &&
        localFile.path_lower === cloudFile.path_lower &&
        localFile.path_display === cloudFile.path_display &&
        localFile.id === cloudFile.id &&
        localFile.server_modified === cloudFile.server_modified &&
        localFile.rev === cloudFile.rev &&
        localFile.size === cloudFile.size &&
        localFile.content_hash === cloudFile.content_hash
      ) {
      return true
    } else {
      LogHandler.silly(`File metadata objects differ`, _.difference(localFile, cloudFile))
      return false
    }
  }
}
