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

module.exports = class Nodebox {

  constructor (Provider = DefaultCloudStorageProvider) {
    this.CloudStorageInterface = new CloudStorageInterface(Provider)
    this.FilesystemStorageInterface = new FilesystemStorageInterface()
    this.StorageWorker = new StorageWorker()
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

  }
}