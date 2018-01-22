'use strict'

/**
 * This module extends the default `fs` module with a few functions.
 *
 * @augments fs
 */

const fs = require('fs')
const dir = require('node-dir')

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
 * @returns {Promise} Resolves to recursive file list, rejects to error
 */
fs.dir = (p) => {
  return new Promise((resolve, reject) => {
    if (fs.statSync(p).isDirectory()) {
      dir.paths(p, true, (err, paths) => {
        if (err) {
          reject(err)
        }
        resolve(paths.sort())
      })
    } else {
      resolve(p)
    }
  })
}

/**
 * Run fs.statSync and handle the error.
 *
 * @since 1.0.0
 * @param {string} p Path to "stat"
 * @returns {object} stats object
 */
fs.statSyncError = (p) => {
  return fs.statSync(p, (err, stats) => {
    if (err) {
      console.log(err)
    }
    return stats
  })
}

module.exports = fs
