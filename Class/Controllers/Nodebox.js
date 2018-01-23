'use strict'

const CloudStorageInterface = require('../Interfaces/Storage/CloudStorageInterface')
const DefaultCloudStorageProvider = require('../Interfaces/Storage/Provider/DropboxStorageInterfaceProvider')
const FilesystemStorageInterface = require('../Interfaces/Storage/FilesystemStorageInterface')

const StorageWorker = require('../Workers/Storage/StorageWorker')
const StorageWatcher = require('../Watchers/Storage/StorageWatcher')
const MessageQueue = require('../Queues/MessageQueue')

const UploadWorker = require('../Workers/Transfer/UploadWorker')
const DownloadWorker = require('../Workers/Transfer/DownloadWorker')

const DatabaseInterface = require('../Interfaces/Data/DatabaseInterface')
const ConfigInterface = require('../Interfaces/Config/ConfigInterface')

const ErrorHandler = require('../Handlers/Error/ErrorHandler')
const LogHandler = require('../Handlers/Log/LogHandler')
const EventEmitter = require('../Emitters/EventEmitter')

const fs = require('../../Overrides/fs')
const prompt = require('prompt')

module.exports = class Nodebox {

  constructor (Provider = DefaultCloudStorageProvider) {
    this.CloudStorageInterface = new CloudStorageInterface(Provider)
    this.FilesystemStorageInterface = new FilesystemStorageInterface()
    this.StorageWatcher = new StorageWatcher()
    this.MessageQueue = new MessageQueue()
    this.UploadWorker = new UploadWorker()
    this.DownloadWorker = new DownloadWorker()
    this.DatabaseInterface = new DatabaseInterface()
    this.ConfigInterface = new ConfigInterface({
      path: '/.dotfiles/testfolder'
    })
    this.ErrorHandler = new ErrorHandler()
    this.LogHandler = new LogHandler()
    this.EventEmitter = new EventEmitter()
  }

  go () {
    console.log('Go! :D')

    this.setup()
    this.startIndexers()
  }

  setup () {
    fs.mkdirIfNotExists(this.ConfigInterface.get('storagePath'))

    if (this.ConfigInterface.get('accessToken') === null) {
      this.promptPromise('Please enter a valid API V2 access token').then((accessToken) => {
        this.ConfigInterface.set('accessToken', accessToken)
      }).catch((err) => {
        console.log(err)
      })
    }
    if (this.ConfigInterface.get('path') === null) {
      this.promptPromise('Please enter a valid path within your dropbox').then((path) => {
        this.ConfigInterface.set('path', path)
      }).catch((err) => {
        console.log(err)
      })
    }
  }

  startIndexers () {
    this.CloudStorageWorker = new StorageWorker(this.CloudStorageInterface)
    this.LocalStorageWorker = new StorageWorker(this.FilesystemStorageInterface)

    this.CloudStorageWorker.go()
    this.LocalStorageWorker.go()
  }

  promptPromise (description) {
    return new Promise((resolve, reject) => {
      prompt.start()

      prompt.get({
        properties: {
          input: {
            description: description
          }
        }
      }, (error, result) => {
        if (error) {
          reject(error)
        }
        resolve(result.input)
      })
    })
  }
}