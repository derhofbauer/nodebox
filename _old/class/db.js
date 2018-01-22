'use strict'

const _ = require('lodash')
const path = require('../util/path')
const fs = require('../util/fs')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

/**
 * This module provides an interface to easily access settings and local and
 *   remote file lists. It currently uses LowDB for managing the storage file.
 *
 * @type {module.NodeboxDatabase}
 * @since 1.0.0
 */
module.exports = class NodeboxDatabase {
  /**
   * Initialize LowDB instance
   * @since 1.0.0
   * @param {object} customSettings Overrides default settings
   */
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

    fs.mkdirIfNotExists(_merged.settingsFolder)

    /**
     * LowDB instance
     * @since 1.0.0
     * @var
     *
     * @todo: use custom serializer/deserializer to uglify JSON and save space
     */
    this.db = low(new FileSync(_merged.settingsPath))

    this.db.read()

    this.db.defaults({
      indexLocal: [],
      indexServer: [],
      settings: _defaults
    }).write()

    _.forEach(customSettings, (value, key) => {
      this.setSetting(key, value)
    })

    this.persist()

  }

  /**
   * Get a value from the database by name
   * @since 1.0.0
   * @param {string} name Name of the value to get from the database
   * @returns{mixed} Value of `name`
   */
  get (name) {
    return this.db.get(name).value()
  }

  /**
   * Returns all settings. If `name` is given it returns only the value of
   *   settings.`name`.
   * @since 1.0.0
   * @param {string} name Name of the settings value to get from the database
   * @returns {mixed} Settings or Settings.`name`
   */
  getSettings (name) {
    if (name) {
      return this.get('settings.' + name)
    }
    return this.get('settings')
  }

  /**
   * Returns the whole database object.
   * @since 1.0.0
   * @returns {object} Current database state
   */
  getAll () {
    return this.db.getState()
  }

  /**
   * Stores a named value to the database.
   * @since 1.0.0
   * @param {string} name Name of the value
   * @param {mixed} value Value to be stored
   */
  set (name, value) {
    this.db.set(name, value).write()
  }

  /**
   * Stores a named config value to the database.
   * @since 1.0.0
   * @param {string} name Name of the value; used like settings.`name`
   * @param {mixed} value Value to be stored
   */
  setSetting (name, value) {
    this.set('settings.' + name, value)
  }

  /**
   * Persists database.
   *   Currently this means LowDB serializes it's database object to JSON and
   *   writes it to disk.
   * @since 1.0.0
   */
  persist () {
    this.db.write()
  }

  /**
   * Helper method to easily store the filelist generate by LocalFileListWorker.
   * @since 1.0.0
   * @param {Array.<object>} list filelist generated by LocalFileListWorker
   */
  setIndexLocal (list) {
    console.debug('NodeboxDatabase:setIndexLocal: ', list)
    this.set('indexLocal', list)
  }

  /**
   * Helper method to easily retrieve the local filelist stored in our db file.
   * @since 1.0.0
   * @returns {Array.<Object>} JSON Object from config file
   */
  getIndexLocal () {
    return this.db.get('indexLocal')
  }
}