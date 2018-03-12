'use strict'

const Dropbox = require('dropbox')
const _ = require('lodash')
const LogHandler = require('../../../Handlers/Log/LogHandler')
const MessageQueue = require('../../../Queues/MessageQueue')
const path = require('../../../../Overrides/path')

module.exports = class DropboxStorageInterfaceProvider {
  constructor (ConfigInterface) {
    this.ConfigInterface = ConfigInterface

    this.dbx = new Dropbox({
      accessToken: this.getAccessToken()
    })

    this._longpolling = false

    this.filelist = []
    this._mq = new MessageQueue()

    this._mq.on('has_more', () => {
      this.fetchFilesListFolderContinue()
    })
    this._mq.on('longpoll_has_changes', () => {
      this._longpolling = false
      this.fetchFilesListFolderContinue()
    })
    this._mq.on('has_no_more', () => {
      this.subscribeLongPoll()
      LogHandler.silly('DIR Server', this.dir())
    })
    this._mq.on('longpoll_continue', () => {
      this.subscribeLongPoll()
    })
  }

  go () {
    this.fetchFileslistFolder().then(() => {
      // LogHandler.silly("DIR Server", this.dir())
    }).catch((err) => {
      throw new Error(err)
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
   * @param {string} p Path in Dropobx
   * @return {Promise<object>} Resolves to stats object, rejects if nothing found
   */
  stat (p) {
    return new Promise((resolve, reject) => {
      p = path.addLeadingSlash(p)

      let statsObject = _.find(this.filelist, {'path_lower': p.toLowerCase()})

      if (statsObject !== undefined) {
        resolve(statsObject)
      } else {
        reject()
      }
    })
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
        // LogHandler.error(err)
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
      // LogHandler.verbose('fetchFilesListFolderContinue:then', response)
      console.debug(response)

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
      LogHandler.verbose('ServerFileListWorker:handleListFolderResponse')
      this.handleCursor(response)

      this.dispatchResponse(response)

      // emit an event for this.fetchFilesListFolderContinue to be called
      if (response.has_more === true) {
        this._mq.emit('has_more')
      }
      if (response.has_more === false) {
        this._mq.emit('has_no_more')
      }
    })
  }

  /**
   * Listens to the longpoll endpoint of Dropbox API and handles changes.
   * @since 1.0.0
   */
  subscribeLongPoll () {
    if (!this._longpolling) {
      this._longpolling = true // toggle the switch to enable on connection at once only

      LogHandler.verbose('ServerFileListWorker:subscribeLongPoll')
      this.dbx.filesListFolderLongpoll({
        cursor: this.getLastCursor()
      }).then((response) => {
        LogHandler.verbose('ServerFileListWorker:subscribeLongPoll:then', response)

        if (response.changes === false) {
          if (response.backoff) {
            setTimeout(() => {
              this._mq.emit('longpoll_continue')
              LogHandler.silly(`backoff for ${response.backoff * 1000} seconds`)
            }, response.backoff * 1000)
          } else {
            this._mq.emit('longpoll_continue')
          }
        }

        if (response.changes === true) {
          this._mq.emit('longpoll_has_changes')
        }
      }).catch((err) => {
        LogHandler.verbose('ServerFileListWorker:subscribeLongPoll:catch')
        LogHandler.error(err)
      })
    }
  }

  /**
   * Handles the cursor returned by the Dropbox API by storing it into the
   *   config file.
   * @param {Object.<string,*>} response Fielist or error from Dropbox API
   * @since 1.0.0
   * @todo Needs Testing!
   */
  handleCursor (response) {
    LogHandler.verbose('ServerFileListWorker:handleCursor', this.getLastCursor())
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
   * Removes an entry from the filelist
   * @param {Object.<string,*>} entry File or directory object from Dropbox API
   * @since 1.0.0
   * @todo Needs Testing!
   */
  removeEntryFromList (entry) {
    _.remove(this.filelist, (value) => {
      return value.path_lower === entry.path_lower
    })
  }

  /**
   * Decides what to do with an entry - delete, move or add
   * @param {Object.<*>} response Dropbox API list_folder response
   * @since 1.0.0
   */
  dispatchResponse (response) {
    /**
     * process new files before deleted files!
     *
     * FIRST VERSION:
     * + download new files and folders or copy from existing files
     * + remove deleted files and folders
     *
     * SECOND VERSION:
     *
     * if .tag==file:
     * - check if file with same hash exists on disk already
     * - - yes: copy existing file
     * - - no: queue download of file
     * if .tag==folder:
     * - create folder
     *
     * if .tag==deleted && all 'new' events are finished:
     * - delete file/folder
     *
     * if .tag==deleted && deleted item is file && stored hash of deleted file is same as hash of 'new' file:
     * - mv file
     *
     * if .tag==deleted && deleted item is folder && folder contains files && new files with same hashes as those files must be downloaded
     * - create new folder
     * - mv files
     */

    let folders = _.filter(response.entries, {'.tag': 'folder'})
    // console.log(folders)
    folders.forEach((value) => {
      // create folders
      this.addEntryToList(value)
    })

    let files = _.filter(response.entries, {'.tag': 'file'})
    // console.log(files)
    files.forEach((value) => {
      this.addEntryToList(value)
      // if file exists
        // cp existing file
      // else
        // download file
    })

    let deleted = _.filter(response.entries, {'.tag': 'deleted'})
    // console.log(deleted)
    deleted.forEach((value) => {
      this.removeEntryFromList(value)
      // delete files and folders
    })
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
