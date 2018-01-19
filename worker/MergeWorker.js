'use strict'

const lowdb = require('lowdb')
const async = require('async')
const ASYNC_PARALLEL_LIMIT = 1

/**
 * This module provides a worker class to merge server file list and local file
 *   list and provide a download queue.
 * @type {module.MergeWorker}
 * @since 1.0.0
 */
module.exports = class MergeWorker {

  /**
   * Create initial download queue and start listener
   * @since 1.0.0
   * @param {module.ServerFileListWorker} ServerFileListWorker
   * @param {module.LocalFileListWorker} LocalFileListWorker
   * @param {NodeboxEventEmitter} eventEmitter EventEmitter Instance
   */
  constructor (ServerFileListWorker, LocalFileListWorker, eventEmitter) {
    this.serverFileListWorker = ServerFileListWorker
    this.localFileListWorker = LocalFileListWorker

    this._em = eventEmitter

    this.downloadQueue = []
    this.uploadQueue = []

    this._ready = {
      localWorker: false,
      serverWorker: false
    }

    this._merging = false

    this.startListeners()
  }

  startListeners () {
    this._em.once('localWorker:ready', () => {
      this._ready.localWorker = true
      if (this.bothReady()) {
        this.merge()
      }
    })
    this._em.once('serverWorker:ready', () => {
      this._ready.serverWorker = true
      if (this.bothReady()) {
        this.merge()
      }
    })

    this._em.on('localWorker:change', () => {
      this.localWorkerChanged()
    })
    this._em.on('serverWorker:change', () => {
      this.serverWorkerChanged()
    })
  }

  /**
   * @todo: handle .deleted event!
   * @todo: also handle rename events that consist of .deleted and new .file or .folder by comparing hashes before removing and entry!
   */
  /* initialMerge () {
    let local = this.localFileListWorker.getFileList()
    let server = this.serverFileListWorker.getFileList()

    console.log(local.map('path_lower').value())
    // console.log(server.value())

    server.value().forEach((file, index) => {
      // console.log(file.path_display, local.find({path_lower: file.path_lower}).value() != undefined)

      let localFile = local.find({path_lower: file.path_lower}).value()

      if (localFile !== undefined) {
        console.debug(`${file.path_display}: Path exists locally!`)

        if (file['.tag'] === 'file' && (file.content_hash !== localFile.content_hash || file.size !== localFile.size)) {
          console.log(`${file.path_display}: Hashes or size do not match!`)

          // check which file was edited more recently and handle conflicts
          // + File exists on both ends but is newer* locally: upload file overwriting file on server
          // + File exists on both ends but is newer* on server: download file overwriting local file
          // + File exists in both ends and has conflicting changes: figure out whether Dropbox handles this case or we have to do it

          // before downloading check if we already got a file with the same hash
        }
        if (file['.tag'] === 'deleted') {
          // delete file if this file has not just been renamed!
          // otherwise rename file
        }
      } else {
        if (file['.tag'] === 'folder') {
          console.log(`${file.path_display}: Folder does not exist locally!`)
          // create folder
        }
        if (file['.tag'] === 'file') {
          console.log(`${file.path_display}: File does not exist locally!`)
          // handle file download
          // + download file (before downloading check if we already got a file with the same hash)
          // + add new metadata like `rev` to local index, merging with existing metadata
        }
      }
    })

    local.value().forEach((file, index) => {
      // console.log(file.path_display, server.find({path_lower: file.path_lower}).value() != undefined)
      let serverFile = server.find({path_lower: file.path_lower}).value()

      if (serverFile !== undefined) {
        console.log(`${file.path_display}: Path exists on server!`)

      } else {
        if (file['.tag'] === 'folder') {
          console.log(`${file.path_display}: Folder does not exist on server!`)
        }
        if (file['.tag'] === 'file') {
          console.log(`${file.path_display}: File does not exist on server!`)
        }
      }
    })
  } */

  merge () {
    this._merging = true

    let server = this.serverFileListWorker.getFileList()
    let local = this.localFileListWorker.getFileList()

    console.log(local.map('path_lower').value())
    console.log(server.map('path_lower').value())

    this._merging = false
  }

  mergeOnce () {
    if (this._merging === false) {
      this.merge()
    }
  }

  serverWorkerChanged () {

  }

  localWorkerChanged () {

  }

  bothReady () {
    return (
      this._ready.localWorker === true &&
      this._ready.serverWorker === true)
  }
}