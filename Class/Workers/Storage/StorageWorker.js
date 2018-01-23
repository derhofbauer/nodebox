'use strict'

const StorageWatcher = require('../../Watchers/Storage/StorageWatcher')
const POSITIVE_EVENTS = Array.from(['add', 'change', 'addDir'])
const NEGATIVE_EVENTS = Array.from(['unlink', 'unlinkDir'])

module.exports = class StorageWorker {
  constructor (StorageInterface, config) {
    this.StorageInterface = StorageInterface
    this.StorageWatcher = new StorageWatcher(this.StorageInterface)
  }

  go () {
    this.StorageWatcher.go()

    this.StorageWatcher.MessageQueue.on('new', (item) => {
      this.eventHandler(item)
    })
    // @todo: use async package to handle indexing of files
    // @todo: use propper message queue to only invoke n events at the "same" time
  }

  eventHandler (item) {
    if (POSITIVE_EVENTS.indexOf(item.event) > -1) {
      this.handlePositiveEvent(item)
    }
    if (NEGATIVE_EVENTS.indexOf(item.event) > -1) {
      this.handleNegativeEvent(item)
    }
  }

  handlePositiveEvent (item) {
    // (re-)index item.path
    console.log(item)
  }

  handleNegativeEvent (item) {
    // delete item.path
    console.log(item)
  }
}