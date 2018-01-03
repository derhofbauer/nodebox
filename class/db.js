'use strict'

const _ = require('lodash')
const path = require('../util/path')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

module.exports = class NodeboxDatabase {
  constructor (customSettings) {
    let _defaults = {
      settingsFolder: path.expandTilde('~/.config/nodebox/'),
      settingsPath: path.expandTilde('~/.config/nodebox/nodebox.json'),
      storagePath: path.expandTilde('~/nodebox'),
      path: '/',
      accessToken: null,
      lastCursor: null
    }

    let _merged = _.merge(_defaults, customSettings)

    this.db = low(new FileSync(_merged.settingsPath))
    this.db.read()

    this.db.defaults({ indexLocal: [], indexServer: [], settings: _defaults
    }).write()

    _.forEach(customSettings, (value, key) => {
      this.setSetting(key, value)
    })

    this.persist()
  }

  get (name) {
    return this.db.get(name).value()
  }

  getSettings (name) {
    if (name) {
      return this.get('settings.' + name)
    }
    return this.get('settings')
  }

  getAll () {
    return this.db.getState()
  }

  set (name, value) {
    this.db.set(name, value).write()
  }

  setSetting (name, value) {
    this.set('settings.' + name, value)
  }

  persist () {
    this.db.write()
  }

  setIndexLocal (list) {
    console.log('NodeboxDatabase:setIndexLocal: ', list)
    this.set('indexLocal', list)
  }
}
