'use strict'

const _ = require('lodash')
const nconf = require('nconf')
const path = require('../util/path')
const fs = require('../util/fs')

module.exports = class NodeboxSettings {
  constructor (settingsObject) {
    let settingsPath = path.expandTilde('~/.config/nodebox/nodebox.json')

    fs.mkdirIfNotExists(settingsPath)

    this.settings = nconf.file({file: settingsPath})

    this.settings.defaults({
      settingsFolder: path.expandTilde('~/.config/nodebox/'),
      settingsPath: settingsPath,
      dbPath: path.expandTilde('~/.config/nodebox/nodebox_db.json'),
      storagePath: path.expandTilde('~/nodebox'),
      path: '/',
      accessToken: null,
      lastCursor: null
    })

    this.settings.save()

    _.forEach(settingsObject, (value, key) => {
      this.settings.set(key, value)
    })

    setTimeout(() => {
      this.interval = this.startPersistTimer()
    }, 300 * 1000) // 5 minutes
  }

  get (name) {
    return this.settings.get(name)
  }

  set (name, value) {
    this.settings.set(name, value)
  }

  persist (callback) {
    let defaultCallback = (err) => {
      fs.readFile(this.settings.get('settingsPath'), (err, data) => {
        console.dir(JSON.parse(data.toString()), {colors: true})
      })
    }

    this.settings.save(callback || defaultCallback)
  }

  startPersistTimer (seconds = 300) { // 5 minutes
    return setInterval(this.persist(), seconds * 1000)
  }
}
