'use strict'

const path = require('../../../Overrides/path')

const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const DatabaseInterfaceBase = require('../DatabaseInterfaceBase')

module.exports = class DatabaseInterface extends DatabaseInterfaceBase {
  constructor (databasePath = '~/.config/nodebox/db.json') {
    super('index')

    this.databasePath = path.expandTilde(databasePath)

    this._db = lowdb(new FileSync(this.databasePath))
    this._db.read()

    // `index` will be a object with keys `local` und `cloud/server/whatever`
    //   hold both entries for each path, which will probably make it easier tó
    //   calculate actions.
    this._db.defaults({
      index: []
    }).write()

    this.persist()
  }
}