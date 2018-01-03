'use strict'

const errorHandler = require('../util/errorHandler')

module.exports = class ServerFileListWorker {
  constructor (dbx, settings, loadFilelistOnCreation) {
    this.dbx = dbx
    this.settings = settings
    this.path = this.settings.getSettings('path')

    this.filelist = []

    if (loadFilelistOnCreation === true) {
      this.fetchFileListAndKeepUpdated()
    }

    this._indexing = false
    this._longpolling = false
  }

  fetchFileListAndKeepUpdated () {
    this._indexing = true
    this.dbx.filesListFolder({
      path: this.path,
      recursive: true,
      include_media_info: false,
      include_mounted_folders: true
    }).then((response) => {
      // console.log('ServerFileListWorker:fetchFileListAndKeepUpdated')
      this.handleListFolderReponse(response)

      if (response.has_more) {
        this.fetchFileListContinue()
      } else {
        this._indexing = false
      }
    }).catch((err) => {
      errorHandler.handle(err)
    })
  }

  fetchFileListContinue () {
    this._indexing = true
    this.dbx.filesListFolderContinue({
      cursor: this.last_cursor
    }).then((response) => {
      // console.log('ServerFileListWorker:fetchFileListContinue')
      console.log(this.settings.getSettings('lastCursor'))
      if (response.has_more) {
        this.fetchFileListContinue()
      } else {
        this._indexing = false
        this._longpolling = false
      }

      this.handleListFolderReponse(response)
    }).catch((err) => {
      errorHandler.handle(err)
    })
  }

  handleListFolderReponse (response) {
    console.log('ServerFileListWorker:handleListFolderResponse')
    this.handleCursor(response)

    response.entries.forEach((entry) => {
      this.addEntryTolist(entry)
    })

    if (!response.has_more && !this._longpolling) {
      this.subscribeLongPoll()
    }
  }

  handleCursor (response) {
        // console.log('ServerFileListWorker:handleCursor')
    if (response.cursor) {
      this.settings.setSetting('lastCursor', response.cursor)
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
     *
     * @done: this should work now. Needs some testing!
     */
  subscribeLongPoll () {
    console.log('ServerFileListWorker:subscribeLongPoll')
    this._longpolling = true
    this.dbx.filesListFolderLongpoll({
      cursor: this.settings.getSettings('lastCursor')
    }).then((response) => {
      console.log('ServerFileListWorker:subscribeLongPoll:then')
      console.log(response)

      if (!response.changes) {
        this._longpolling = false

        if (response.backoff) {
          setTimeout(this.subscribeLongPoll(), response.backoff * 1000)
        } else {
          this.subscribeLongPoll()
        }
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

  isIndexing () {
    return this._indexing
  }
}
