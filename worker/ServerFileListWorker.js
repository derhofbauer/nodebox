'use strict'

const errorHandler = require('../util/errorHandler')

/**
 * This module provides a worker class to fetch a filelist from Dropbox and keep
 *   it updated by listening to the longpoll endpoint.
 * @type {module.ServerFileListWorker}
 * @since 1.0.0
 */
module.exports = class ServerFileListWorker {

  /**
   * Fetch file list from Dropbox API and keep it updated
   * @since 1.0.0
   * @param {Dropbox} dbx Dropbox SDK instacne
   * @param {Object} settings Settings object from config file
   * @param {NodeboxEventEmitter} eventEmitter EventEmitter Instance
   * @param {boolean} loadFilelistOnCreation Whether to start creating an index
   *   on instantiation.
   */
  constructor (dbx, settings, eventEmitter, loadFilelistOnCreation = true) {
    this.dbx = dbx
    this.settings = settings
    this.path = this.settings.getSettings('path')

    /**
     * EventEmitter
     * @member {NodeboxEventEmitter}
     */
    this._em = eventEmitter

    this.filelist = []

    if (loadFilelistOnCreation === true) {
      this.fetchFileListAndKeepUpdated()
    }

    /**
     * Indexing switch; true when indexing, false when idle
     * @member {boolean}
     */
    this._indexing = false
    /**
     * Longpolling switch; true when indexing, false when idle
     * @member {boolean}
     */
    this._longpolling = false
  }

  /**
   * Fetch file list from Dropbox API and keep it updated
   * @since 1.0.0
   */
  fetchFileListAndKeepUpdated () {
    this._indexing = true
    console.debug(this.getDefaultConfig())
    this.dbx.filesListFolder(
      this.getDefaultConfig()
    ).then((response) => {
      // console.log('ServerFileListWorker:fetchFileListAndKeepUpdated')
      this.handleListFolderReponse(response)

      if (response.has_more) {
        this.fetchFileListContinue()
      } else {
        this._indexing = false
        this._em.emit('serverWorker:ready')
      }
    }).catch((err) => {
      errorHandler.handle(err)
    })
  }

  /**
   * Fetches the next bit of the file list from Dropbox API and calls itself if
   *   there still is something left
   * @since 1.0.0
   */
  fetchFileListContinue () {
    this._indexing = true
    this.dbx.filesListFolderContinue({
      cursor: this.getLastCursor()
    }).then((response) => {
      // console.log('ServerFileListWorker:fetchFileListContinue')
      console.debug(this.settings.getSettings('lastCursor'))
      if (response.has_more) {
        this.fetchFileListContinue()
      } else {
        this._indexing = false
        this._em.emit('serverWorker:ready')
        this._longpolling = false
      }

      this.handleListFolderReponse(response)
    }).catch((err) => {
      errorHandler.handle(err)
    })
  }

  /**
   * Handles Dropbox API response and starts longpolling if this was the last bit
   * @since 1.0.0
   * @param {Object.<string,*>} response Filelist or error from Dropbox API
   */
  handleListFolderReponse (response) {
    console.debug('ServerFileListWorker:handleListFolderResponse')
    this.handleCursor(response)

    response.entries.forEach((entry) => {
      this.addEntryTolist(entry)
    })

    if (!response.has_more && !this._longpolling) {
      this.subscribeLongPoll()
    }
  }

  /**
   * Handles the cursor returned by the Dropbox API by storing it into the
   *   config file.
   * @param {Object.<string,*>} response Fielist or error from Dropbox API
   */
  handleCursor (response) {
    // console.log('ServerFileListWorker:handleCursor')
    if (response.cursor) {
      this.settings.setSetting('lastCursor', response.cursor)
    }
  }

  /**
   * Ppushes an entry to the file list attribute
   * @param {Object.<string,*>} entry File or directory object from Dropbox API
   */
  addEntryTolist (entry) {
    // console.log('ServerFileListWorker:addEntryToList')
    if (entry.id) {
      this.filelist[entry.id] = entry
    } else {
      this.filelist.push(entry)
    }
  }

  /**
   * Listenes to the longpoll endpoint of Dropbox API and handles changes.
   * @since 1.0.0
   */
  subscribeLongPoll () {
    console.debug('ServerFileListWorker:subscribeLongPoll')
    this._longpolling = true
    this.dbx.filesListFolderLongpoll({
      cursor: this.getLastCursor()
    }).then((response) => {
      console.debug('ServerFileListWorker:subscribeLongPoll:then')
      console.debug(response)

      if (!response.changes) {
        this._longpolling = false

        if (response.backoff) {
          setTimeout(this.subscribeLongPoll(), response.backoff * 1000)
        } else {
          this.subscribeLongPoll()
        }
      }

      if (response.changes === true) {
        this.fetchFileListContinue()
      }
    }).catch((err) => {
      console.debug('ServerFileListWorker:subscribeLongPoll:catch')
      this._longpolling = false
      errorHandler.handle(err)
    })
  }

  /**
   * Returns the latest cursor from the database. If there is none, it fetches
   *   the latest cursor from the Dropbox API and stores it to the database.
   * @since 1.0.0
   * @returns {string} Latest cursor
   */
  getLastCursor () {
    let lastCursor = this.settings.getSettings('lastCursor')

    if (lastCursor === '') {
      this.dbx.filesListFolderGetLatestCursor(
        this.getDefaultConfig()
      ).then((response) => {
        this.handleCursor(response)
        return this.settings.getSettings('lastCursor')
      }).catch((err) => {
        errorHandler.handle(err)
        throw new Error('No cursor found!')
      })
    } else {
      return lastCursor
    }
  }

  /**
   * Returns the default config for Dropbox API list folder endpoints
   * @since 1.0.0
   * @returns {{path: mixed|MediaTrackSettings|*, recursive: boolean, include_media_info: boolean, include_mounted_folders: boolean}}
   */
  getDefaultConfig() {
    return {
      path: this.path,
      recursive: true,
      include_media_info: false,
      include_mounted_folders: true
    }
  }

  /**
   * Helper method to check indexing switch
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
    return this.filelist
  }
}