'use strict'

/**
 * This module extends the default `fs` module with a few functions.
 */

const fs = require('fs')
const path = require('./path')

/**
 * Create directory if it does not exist
 *
 * @since 1.0.0
 * @param {string} dir Path to create if it does not exist
 */
fs.mkdirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

/**
 * Create a recursive file list from a given path (`p`). If `p` is not a
 *     directory, it is returned.
 *
 * @since 1.0.0
 * @param {string} p Path to create a file list of
 * @return {Array.<string>} Recursive file list
 */
fs.walkSync = (p) => {
  if (fs.statSync(p).isDirectory()) {
    return fs.readdirSync(p).map((subPath) => {
      return fs.joinOrWalkSync(p, subPath)
    })
  } else {
    return p
  }
}

/**
 * Check if joined paths produce a directory. If they do call `fs.walkSync`,
 *     else return it, because it is a file.
 *
 * @since 1.0.0
 * @param {string} p Current working path
 * @param {string} subPath One item below `p`
 * @return {string}|{Array.<string>}
 */
fs.joinOrWalkSync = (p, subPath) => {
    let fullPath = path.join(p, subPath)

    if (fs.statSync(fullPath).isDirectory()) {
        return fullPath
    }
    return fs.walkSync(fullPath)
}

module.exports = fs
