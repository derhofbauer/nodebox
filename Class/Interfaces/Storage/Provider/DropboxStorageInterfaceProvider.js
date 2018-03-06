'use strict'

const Dropbox = require('dropbox')
const _ = require('lodash')
const LogHandler = require('../../../Handlers/Log/LogHandler')
const MessageQueue = require('../../../Queues/MessageQueue')

module.exports = class DropboxStorageInterfaceProvider {
  constructor (ConfigInterface) {
    this.ConfigInterface = ConfigInterface

    this.dbx = new Dropbox({
      accessToken: this.getAccessToken()
    })

    this.filelist = []
    this._mq = new MessageQueue()

    this._mq.on('has_more', () => {
      this.fetchFilesListFolderContinue()
    })
  }

  getAccessToken (string = true) {
    return this.ConfigInterface.get('accessToken')
  }

  getPath () {
    return this.ConfigInterface.get('path')
  }

  getLastCursor () {
    return this.ConfigInterface.get('lastCursor')
  }

  dir () {
    return new Promise((resolve, reject) => {
      if (this.filelist.length === 0) {
        this.fetchFileslistFolderAndKeepUpdated()
      } else {
        resolve(this.filelist)
      }
    })
  }

  stat () {

  }

  getDefaultParams () {
    return {
      path: this.getPath(),
      recursive: true,
      include_media_info: false,
      include_mounted_folders: true,
      include_deleted: false,

    }
  }

  /**
   * Fetch file list from Dropbox API and keep it updated
   * @since 1.0.0
   */
  fetchFileslistFolderAndKeepUpdated () {
    this.dbx.fileListFolder(
      this.getDefaultParams()
    ).then((response) => {
      this.handleFileListFolderResponse(response)
    }).catch((err) => {
      LogHandler.error(err)
    })
  }

  /**
   * Fetches the next bit of the file list from Dropbox API and emit an event to
   *   be called again, if there is something left.
   * @since 1.0.0
   */
  fetchFilesListFolderContinue () {
    this.dbx.filesListFolderContinue({
      cursor: this.getLastCursor()
    }).then((response) => {
      this.handleFileListFolderResponse(response)
    }).catch((err) => {
      LogHandler.error(err)
    })
  }

  /**
   * Handles Dropbox API response and starts longpolling if this was the last bit
   * @since 1.0.0
   * @param {Object.<string,*>} response Filelist or error from Dropbox API
   * @return {Promise<any>} Always resolves
   */
  handleFileListFolderResponse (response) {
    return new Promise((resolve) => {
      console.debug('ServerFileListWorker:handleListFolderResponse')
      this.handleCursor(response)

      response.entries.forEach((entry, index, collection) => {
        this.addEntryTolist(entry)

        if (index === collection.length - 1) {
          resolve()
        }
      })

      // emit an event for this.fetchFilesListFolderContinue to be called
      if (response.has_more === true) {
        this._mq.emit('has_more')
      }

      if (!response.has_more && !this._longpolling) {
        this.subscribeLongPoll()
      }
    })
  }

  /**
   * Handles the cursor returned by the Dropbox API by storing it into the
   *   config file.
   * @param {Object.<string,*>} response Fielist or error from Dropbox API
   * @since 1.0.0
   */
  handleCursor (response) {
    // console.log('ServerFileListWorker:handleCursor')
    if (response.cursor) {
      this.ConfigInterface.set('lastCursor', response.cursor)
    }
  }

  /**
   * Pushes an entry to the filelist
   * @param {Object.<string,*>} entry File or directory object from Dropbox API
   * @since 1.0.0
   */
  addEntryToList (entry) {
    this.filelist.push(entry)
  }
}