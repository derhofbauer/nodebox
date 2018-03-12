'use strict'

const MessageQueue = require('../../Queues/MessageQueue')
const LogHandler = require('../../Handlers/Log/LogHandler')

module.exports = class StorageWatcherBase {
  /**
   * Constructor
   * @since 1.0.0
   * @param {StorageInterface} StorageInterface
   */
  constructor (StorageInterface) {
    this.StorageInterface = StorageInterface
    this.MessageQueue = new MessageQueue()
  }

  /**
   * Starts the whole dang thing ;)
   * @since 1.0.0
   */
  go () {
    this.startWatcher()
  }
}