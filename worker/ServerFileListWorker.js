'use strict'

const _ = require('lodash')
const errorHandler = require('../util/errorHandler')

module.exports = class ServerFileListWorker {
  constructor (dbx, path, load_filelist_on_creation) {
    this.dbx = dbx
    this.path = path

    this.filelist = []

    if (load_filelist_on_creation === true) {
      this.fetchFileList()
    }

    this.last_cursor = ''
    this._longpolling = false
  }

  fetchFileList () {
    this.dbx.filesListFolder({
      path: this.path,
      recursive: true,
      include_media_info: false,
      include_mounted_folders: true
    }).then((response) => {
            // console.log('ServerFileListWorker:fetchFileList')
      this.handleListFolderReponse(response)

      if (response.has_more) {
        this.fetchFileListContinue()
      }
    }).catch((err) => {
      errorHandler.handle(err)
    })
  }

  fetchFileListContinue () {
    this.dbx.filesListFolderContinue({
      cursor: this.last_cursor
    }).then((response) => {
            // console.log('ServerFileListWorker:fetchFileListContinue')
      this.handleListFolderReponse(response)

      if (response.has_more) {
        this.fetchFileListContinue()
      }
    }).catch((err) => {
      errorHandler.handle(err)
    })
  }

  handleListFolderReponse (response) {
    console.log('ServerFileListWorker:handleListFolderResponse')
    this.handleCursor(response)

    _.forEach(response.entries, (entry) => {
      this.addEntryTolist(entry)
    })

    if (!response.has_more && !this._longpolling) {
      this.subscibreLongPoll()
    }
  }

  handleCursor (response) {
        // console.log('ServerFileListWorker:handleCursor')
    if (response.cursor) {
      this.last_cursor = response.cursor
    }
  }

  addEntryTolist (entry) {
        // console.log('ServerFileListWorker:addEntryToList')
    if (entry.id) {
      this.filelist[entry.id] = entry
      return
    }
    this.filelist.push(entry)
  }

    /**
     * @todo: This opens a few connections, since it calls itself, before a new cursor is recieved by
     * @todo: this.fetchFileListContinue()!
     * @todo: this._longpolling has to be stoppped on different places, so this.subscribeLongPoll() only runs after
     * @todo: this.fetchFileListContinue() has run and a new cursor is present!
     */
  subscibreLongPoll () {
    console.log('ServerFileListWorker:subscribeLongPoll')
    this._longpolling = true
    this.dbx.filesListFolderLongpoll({
      cursor: this.last_cursor
    }).then((response) => {
      console.log('ServerFileListWorker:subscribeLongPoll:then')
      console.log(response)
      this._longpolling = false

      if (response.backoff) {
        setTimeout(this.subscibreLongPoll(), response.backoff * 1000)
      } else {
        this.subscibreLongPoll()
      }

      if (response.changes) {
        this.fetchFileListContinue()
      }
    }).catch((err) => {
      console.log('ServerFileListWorker:subscribeLongPoll:catch')
      this._longpolling = false
      errorHandler.handle(err)
    })
  }
}
