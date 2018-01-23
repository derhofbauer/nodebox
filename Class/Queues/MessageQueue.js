'use strict'

const EventEmitter = require('../Emitters/EventEmitter')

module.exports = class MessageQueue extends EventEmitter {
  constructor () {
    super()

    this._mq = []
  }

  push (item) {
    this._mq.push(item)
    this.emit('new', item)
  }

  first () {
    return this._mq.shift()
  }
}