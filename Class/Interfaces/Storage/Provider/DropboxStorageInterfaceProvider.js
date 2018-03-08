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
    this._mq.on('longpoll_has_changes', () => {
      this.fetchFilesListFolderContinue()
    })
    this._mq.on('has_no_more', () => {
      this.subscribeLongPoll()
    })
    this._mq.on('longpoll_continue', () => {
      this.subscribeLongPoll()
    })

    this.fetchFileslistFolder().then(() => {
      console.log(this.dir())
    })
  }

  getAccessToken (string = true) {
    return this.ConfigInterface.get('accessToken')
  }

  getPath () {
    return this.ConfigInterface.get('path')
  }

  /**
   * Returns a flat file list with full relative paths based on the cached
   *   filelist. If the cached filelist is empty, it returns an empty array.
   *   This is because the do not need to be files in a Dropbox account.
   * @since 1.0.0
   * @param {bool} useLowercasePath Use path_lower instead of path_display;
   *   default: path_display
   * @return {Promise<Array<String>>} Always resolves to recursive file list
   */
  dir (useLowercasePath = false) {
    return new Promise((resolve) => {
      let _dir = _.map(this.filelist, (value) => {
        if (useLowercasePath === true) {
          return value.path_lower
        } else {
          return value.path_display
        }
      })
      _dir.sort()
      resolve(_.uniq(_dir))
    })
  }

  /**
   * Returns stats to one single entry. If the entry is not found in the cached
   *   filelist, the Dropbox API is requested.
   * @param path
   */
  stat (path) {

  }

  getDefaultParams () {
    return {
      path: this.getPath(),
      recursive: true,
      include_media_info: false,
      include_mounted_folders: true,
      include_deleted: false
    }
  }

  /**
   * Fetch file list from Dropbox API and keep it updated
   * @since 1.0.0
   * @todo Needs Testing!
   */
  fetchFileslistFolder () {
    return new Promise((resolve, reject) => {
      this.dbx.filesListFolder(
        this.getDefaultParams()
      ).then((response) => {
        this._mq.on('has_no_more', () => {
          resolve(this.filelist)
        })

        this.handleFileListFolderResponse(response)
      }).catch((err) => {
        LogHandler.error(err)
        reject(err)
      })
    })
  }

  /**
   * Fetches the next bit of the file list from Dropbox API and emit an event to
   *   be called again, if there is something left.
   * @since 1.0.0
   * @todo Needs Testing!
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
   * @todo Needs Testing!
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
      if (response.has_more === false) {
        this._mq.emit('has_no_more')
      }

      if (!response.has_more && !this._longpolling) {
        this.subscribeLongPoll()
      }
    })
  }

  /**
   * Listens to the longpoll endpoint of Dropbox API and handles changes.
   * @since 1.0.0
   */
  subscribeLongPoll () {
    console.debug('ServerFileListWorker:subscribeLongPoll')
    this.dbx.filesListFolderLongpoll({
      cursor: this.getLastCursor()
    }).then((response) => {
      console.debug('ServerFileListWorker:subscribeLongPoll:then', response)

      if (!response.changes) {
        if (response.backoff) {
          setTimeout(() => {
            this._mq.emit('longpoll_continue', response.backoff * 1000)
          })
        } else {
          this._mq.emit('longpoll_continue')
        }
      }

      if (response.changes === true) {
        this._mq.emit('longpoll_has_changes')
      }
    }).catch((err) => {
      console.debug('ServerFileListWorker:subscribeLongPoll:catch')
      LogHandler.error(err)
    })
  }

  /**
   * Handles the cursor returned by the Dropbox API by storing it into the
   *   config file.
   * @param {Object.<string,*>} response Fielist or error from Dropbox API
   * @since 1.0.0
   * @todo Needs Testing!
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
   * @todo Needs Testing!
   */
  addEntryToList (entry) {
    this.filelist.push(entry)
  }
  /**
   * Returns the latest cursor from the database. If there is none, it fetches
   *   the latest cursor from the Dropbox API and stores it to the database.
   * @since 1.0.0
   * @returns {string} Latest cursor
   */
  getLastCursor () {
    let lastCursor = this.ConfigInterface.get('lastCursor')

    if (lastCursor === '') {
      this.dbx.filesListFolderGetLatestCursor(
        this.getDefaultParams()
      ).then((response) => {
        this.handleCursor(response)
        return this.ConfigInterface.get('lastCursor')
      }).catch((err) => {
        LogHandler.error(err)
        throw new Error('No cursor found!')
      })
    }

    return lastCursor
  }
}