'use strict'

const low = require('lowdb')
const Memory = require('lowdb/adapters/Memory')

/**
 * This module provides a base class for FileListWorkers.
 *   Common functions and members are defined here and inherited into the
 *   extending classes.
 * @type {module.FileListWorkerBase}
 * @since 1.0.0
 */
module.exports = class FileListWorkerBase {

  /**
   * Set common members
   * @since 1.0.0
   * @param {Dropbox} dbx Dropbox SDK instance
   * @param {NodeboxEventEmitter} eventEmitter EventEmitter instance
   */
  constructor (dbx, eventEmitter) {

    this.dbx = dbx
    /**
     * Indexing switch; true when indexing, false when idle
     * @member {boolean}
     */
    this._indexing = false

    /**
     * EventEmitter
     * @member {NodeboxEventEmitter}
     */
    this._em = eventEmitter

    /**
     * @member {Lowdb}
     */
    this.filelist = low(new Memory())
    this.filelist.defaults({ filelist: [] }).write()
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
   * Returns the local file list
   * @since 1.0.0
   * @returns {Array.<Object>} Local file list
   */
  getFileList () {
    return this.filelist.get('filelist')
  }
}