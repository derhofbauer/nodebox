'use strict'

module.exports = class DatabaseInterfaceBase {
  /**
   * Set database prefix
   * @since 1.0.0
   * @param {string} baseKey
   */
  constructor (baseKey = '') {
    this.baseKey = baseKey
  }
  /**
   * Stores a named config value to the database.
   * @since 1.0.0
   * @param {string} name Name of the value; used like settings.`name`
   * @param {mixed} value Value to be stored
   */
  set (name, value) {
    this._db.set(`${this.baseKey}.${name}`, value).write()
  }

  /**
   * Get a value from the database by name
   * @since 1.0.0
   * @param {string} name Name of the value to get from the database
   * @returns{mixed} Value of `name`
   */
  get (name) {
    return this._db.get(`${this.baseKey}.${name}`).value()
  }

  /**
   * Get the current state of the database
   * @since 1.0.0
   * @return {*} Current state of database
   */
  getState () {
    return this._db.getState()
  }

  /**
   * Persists database.
   *   Currently this means LowDB serializes it's database object to JSON and
   *   writes it to disk.
   * @since 1.0.0
   */
  persist () {
    this._db.write()
  }

  /**
   * Get the LowDB instance to run search functions directly against it
   * @since 1.0.0
   * @return {object} LowDB instance
   */
  getDb () {
    return this._db
  }
}