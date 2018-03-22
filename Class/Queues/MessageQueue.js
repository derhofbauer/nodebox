'use strict'

const EventEmitter = require('../Emitters/EventEmitter')

module.exports = class MessageQueue extends EventEmitter {
  constructor () {
    super()

    this._mq = []
  }

  push (item, eventName = 'new') {
    this._mq.push(item)
    this.emit(eventName, item)
  }

  first () {
    return this._mq.shift()
  }

  get () {
    return this.first()
  }
}
