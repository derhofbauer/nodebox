'use strict'

const path = require('../../../Overrides/path')
const fs = require('../../../Overrides/fs')

const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const _ = require('lodash')

module.exports = class ConfigInterface {
  constructor (customSettings) {
    let settingsFolder = path.expandTilde('~/.config/nodebox/')
    let settingsPath = path.expandTilde('~/.config/nodebox/config.json')
    let _defaults = {
      storagePath: path.expandTilde('~/nodebox'),
      databasePath: path.expandTilde('~/.config/nodebox/db.json'),
      path: '/',
      accessToken: null,
      lastCursor: null
    }

    fs.mkdirIfNotExists(settingsFolder)

    this.settings = lowdb(new FileSync(settingsPath))

    this.settings.read()

    this.settings.defaults({
      settings: _defaults
    }).write()

    _.forEach(customSettings, (value, key) => {
      this.set(key, value)
    })

    this.persist()
  }

  /**
   * Stores a named config value to the database.
   * @since 1.0.0
   * @param {string} name Name of the value; used like settings.`name`
   * @param {mixed} value Value to be stored
   */
  set (name, value) {
    this.settings.set(name, value).write()
  }

  /**
   * Get a value from the database by name
   * @since 1.0.0
   * @param {string} name Name of the value to get from the database
   * @returns{mixed} Value of `name`
   */
  get (name) {
    return this.settings.get(name).value()
  }

  getState () {
    return this.settings.getState()
  }

  /**
   * Persists database.
   *   Currently this means LowDB serializes it's database object to JSON and
   *   writes it to disk.
   * @since 1.0.0
   */
  persist () {
    this.settings.write()
  }
}