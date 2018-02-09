'use strict'

const path = require('../../../Overrides/path')

const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const DatabaseInterfaceBase = require('../DatabaseInterfaceBase')
const LogHandler = require('../../Handlers/Log/LogHandler')

module.exports = class DatabaseInterface extends DatabaseInterfaceBase {
  /**
   * Constructor
   * @since 1.0.0
   * @param {string} databasePath Path to database file
   */
  constructor (databasePath = '~/.config/nodebox/db.json') {
    super('index')

    this.databasePath = path.expandTilde(databasePath)

    this._db = lowdb(new FileSync(this.databasePath))
    this._db.read()

    this._db.defaults({
      index: []
    }).write()

    this.persist()
  }

  /**
   * Add or update path database entry
   * @since 1.0.0
   * @param {object} path Path object containg paths, stats and hash
   * @returns {Promise<object>} New entry stored in database
   */
  addOrUpdateByPath (file) {
    return new Promise((resolve) => {
      let existingFile = this.get().find({path_lower: file.path_lower})

      if (existingFile.value() !== undefined) {
        resolve(existingFile.assign(file).write())
      } else {
        resolve(this.get().push(file).write())
      }
    })
  }

  /**
   * Remove path database entry
   * @since 1.0.0
   * @param {string} file Path to be deleted from db
   * @returns {Promise>} Always resolves
   */
  removeByPath (file) {
    return new Promise((resolve) => {
      this.get().remove({path_lower: file}).write()
      resolve()
    })
  }

  /**
   * Returns file entries by path from database
   * @param {string} file Path to be retreived from database
   * @returns {Promise<Object|undefined>} Always resolves to lowdb result value
   *   (Object|undefined)
   */
  getByPath (file) {
    return new Promise((resolve) => {
      resolve(this.get().find({path_lower: file}).value())
    })
  }
}