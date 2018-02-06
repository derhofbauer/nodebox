'use strict'

/**
 * This module extends the default `fs` module with a few functions.
 *
 * @augments fs
 */

const fs = require('fs')
const dir = require('node-dir')
const pathExists = require('path-exists')

/**
 * Create directory if it does not exist
 *
 * @since 1.0.0
 * @param {string} dir Path to create if it does not exist
 * @return {Promise<any>} Resolves on success
 */
fs.mkdirIfNotExists = (dir) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, (err) => {
      if (err.code !== 'EEXIST') {
        reject(err)
      } else {
        resolve()
      }
    })
  })
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
    fs.statPromise(p).then((stats) => {
      if (stats.isDirectory()) {
        dir.paths(p, true, (err, paths) => {
          if (err) {
            reject(err)
          }
          resolve(paths.sort())
        })
      } else {
        resolve(p)
      }
    }).catch((err) => {
      reject(err)
    })
  })
}

/**
 * Run fs.stat and handle the error.
 *
 * @since 1.0.0
 * @param {string} p Path to "stat"
 * @returns {Promise<any>} Resolves to stat, rejects to error
 */
fs.statPromise = (p) => {
  return new Promise((resolve, reject) => {
    fs.stat(p, (err, stats) => {
      if (err) {
        reject(err)
      }
      resolve(stats)
    })
  })
}

/**
 * Asynchoniously check for existence of `path`.
 *
 * @since 1.0.0
 * @param {string} path Path to test
 * @returns {Promise<any>} Always resolves, true if exists, false if not
 */
fs.exists = (path) => {
  return new Promise((resolve, reject) => {
    pathExists(path).then((exists) => {
      resolve(exists)
    }).catch((error) => {
      reject(error)
    })
  })
}

module.exports = fs
