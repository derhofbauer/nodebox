'use strict'

const path = require('../../../Overrides/path')
const fs = require('../../../Overrides/fs')

const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const _ = require('lodash')

const DatabaseInterfaceBase = require('../DatabaseInterfaceBase')

module.exports = class ConfigInterface extends DatabaseInterfaceBase {
  /**
   * Constructor
   * @since 1.0.0
   * @param {object} customSettings Settings object; will be merge with current
   */
  constructor (customSettings) {
    super('settings')

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

    this._db = lowdb(new FileSync(settingsPath))

    this._db.read()

    this._db.defaults({
      settings: _defaults
    }).write()

    _.forEach(customSettings, (value, key) => {
      this.set(key, value)
    })

    this.persist()
  }

  /**
   * Returns single config value
   * @since 1.0.0
   * @param {string} name Name of config directive
   * @return {mixed} Value of `name`
   */
  get (name) {
    return this._db.get(`${this.baseKey}.${name}`).value()
  }
}