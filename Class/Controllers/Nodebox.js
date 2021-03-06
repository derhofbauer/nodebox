'use strict'

const CloudStorageInterface = require('../Interfaces/Storage/CloudStorageInterface')
const DefaultCloudStorageProvider = require('../Interfaces/Storage/Provider/DropboxStorageInterfaceProvider')
const FilesystemStorageInterface = require('../Interfaces/Storage/FilesystemStorageInterface')

const LocalStorageWorker = require('../Workers/Storage/LocalStorageWorker')
const CloudStorageWorker = require('../Workers/Storage/CloudStorageWorker')
const MessageQueue = require('../Queues/MessageQueue')

const MergeWorker = require('../Workers/MergeWorker')

// const UploadWorker = require('../Workers/Transfer/UploadWorker')
// const DownloadWorker = require('../Workers/Transfer/DownloadWorker')

const DatabaseInterface = require('../Interfaces/Data/DatabaseInterface')
const ConfigInterface = require('../Interfaces/Config/ConfigInterface')

const ErrorHandler = require('../Handlers/Error/ErrorHandler')
const LogHandler = require('../Handlers/Log/LogHandler')
const EventEmitter = require('../Emitters/EventEmitter')

const fs = require('../../Overrides/fs')
const promptly = require('promptly')

module.exports = class Nodebox {
  /**
   * Constructor
   * @since 1.0.0
   * @param {DropboxStorageInterfaceProvider} Provider Cloud storage interface provider
   */
  constructor (Provider = DefaultCloudStorageProvider) {
    this.MessageQueue = new MessageQueue()
    // this.UploadWorker = new UploadWorker()
    // this.DownloadWorker = new DownloadWorker()
    this.ConfigInterface = new ConfigInterface({
      path: '/.dotfiles/testfolder'
    })
    this.DatabaseInterface = new DatabaseInterface()
    this.ErrorHandler = new ErrorHandler()
    this.EventEmitter = new EventEmitter()
    this.CloudStorageInterface = new CloudStorageInterface(
      new Provider(
        this.ConfigInterface
      )
    )
  }

  /**
   * Starts the whole dang thing ;)
   * @since 1.0.0
   */
  go () {
    LogHandler.log('Go! :D')

    this.setup().then(() => {
      this.startIndexers()
      this.startMergeWorker()
    })
  }

  /**
   * Prompts the user for required config
   * @since 1.0.0
   * @returns {Promise<any>} Array of promises
   */
  setup () {
    return new Promise((resolve) => {
      fs.mkdirIfNotExists(this.ConfigInterface.get('storagePath'))

      let promiseStack = []

      if (this.ConfigInterface.get('accessToken') === null) {
        promiseStack.push(
          this.promptForConfig('Please enter a valid API V2 access token:', 'accessToken')
        )
      }
      if (this.ConfigInterface.get('path') === null) {
        promiseStack.push(
          this.promptForConfig('Please enter a valid path within your dropbox:', 'path')
        )
      }

      Promise.all(promiseStack).then(() => {
        resolve()
      })
    })
  }

  /**
   * CLI prompts the user
   * @since 1.0.0
   * @param {string} question Description of what the user is supposed to input
   * @param {string} configName Name of the config value we ask for
   * @returns {Promise<any>} Resolves on input, rejects on error
   */
  promptForConfig (question, configName = null) {
    return promptly.prompt(question).then((answer) => {
      if (configName !== null) {
        this.ConfigInterface.set(configName, answer)
      }
    }).catch((err) => {
      LogHandler.error(err)
    })
  }

  /**
   * Start the LocalStorageWorker and CloudStorageWorker
   * @since 1.0.0
   */
  startIndexers () {
    this.LocalStorageWorker = new LocalStorageWorker(
      new FilesystemStorageInterface(
        this.ConfigInterface.get('storagePath')
      ),
      this.DatabaseInterface
    )
    this.CloudStorageWorker = new CloudStorageWorker(
      this.CloudStorageInterface,
      this.DatabaseInterface
    )

    this.LocalStorageWorker.go()
    LogHandler.debug('LocalStorageWorker started')

    this.CloudStorageWorker.go()
    LogHandler.debug('CloudStorageWorker started')

    // this.LocalStorageWorker.on('ready', () => {
    //   this.LocalStorageWorker.StorageInterface.dir().then((dir) => {
    //     console.log('Local:', dir)
    //   })
    // })
    //
    // this.CloudStorageWorker.on('ready', () => {
    //   this.CloudStorageWorker.StorageInterface.dir().then((dir) => {
    //     console.log('Cloud:', dir)
    //   })
    // })
  }

  startMergeWorker () {
    this.MergeWorker = new MergeWorker(
      this.LocalStorageWorker,
      this.CloudStorageWorker,
      this.DatabaseInterface
    )
  }
}
