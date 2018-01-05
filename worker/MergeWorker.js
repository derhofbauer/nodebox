'use strict'

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

    this._ready = {
      localWorker: false,
      serverWorker: false
    }

    this._merging = false
  }

  startListeners () {
    this._em.once('localWorker:ready', () => {
      this._ready.localWorker = true
    })
    this._em.once('serverWorker:ready', () => {
      this._ready.serverWorker = true
    })
    this._em.once('localWorker:ready serverWorker:ready', () => {
      if (this.bothReady()) {
        this.initialMerge()
      }
    })

    this._em.on('localWorker:change', () => {
      this.localWorkerChanged()
    })
    this._em.on('serverWorker:change', () => {
      this.serverWorkerChanged()
    })
  }

  initialMerge() {
    let local = this.localFileListWorker.getFileList()
    let server = this.serverFileListWorker.getFileList()
  }

  merge () {
    this._merging = true
    // do stuff
    this._merging = false
  }

  mergeOnce () {
    if (this._merging === false) {
      this.merge()
    }
  }

  serverWorkerChanged() {

  }

  localWorkerChanged() {

  }

  bothReady() {
    return (
      this._ready.localWorker === true &&
      this._ready.serverWorker === true)
  }
}
