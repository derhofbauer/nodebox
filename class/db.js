'use strict'

const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

module.exports = (dbPath) => {
    let db = low(new FileSync(dbPath))

    // Set some defaults
    db.defaults({ indexLocal: [], indexServer: [], settings: {} })
      .write()

    return db
}