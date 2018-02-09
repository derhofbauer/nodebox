'use strict'

const DatabaseInterface = require('./DatabaseInterface')

module.exports = class FilelistInterface extends DatabaseInterface {
  constructor () {
    super()

    return this._db
  }

  updateFile (path, newJson) {
    console.log(this.get(path))
  }
}
