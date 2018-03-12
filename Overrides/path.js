'use strict'

/**
 * This module extends the `path` module with a few functions.
 *
 * @augments path
 */

const path = require('path')
const os = require('os')

/**
 * Resolves first `~` character in relative paths to current users home
 *   directory. If path does not contain a tilde character, the path is returned
 *   unchanged.
 *
 * @since 1.0.0
 * @param {string} p Path to resolve
 * @returns {string} Computed path
 */
path.expandTilde = (p) => {
  if (p.indexOf('~') > -1) {
    return p.replace('~', os.homedir())
  }
  return p
}

/**
 * Removes given static fragment from path to make it relative.
 *
 * @since 1.0.0
 * @param {string} p Path to resolve
 * @param {string} fragment Static fragment to be removed
 * @returns {string} Computed path
 */
path.relatify = (p, fragment) => {
  return p.replace(fragment, '')
}

/**
 * Adds a leading slash if there is none, otherwise does not change anything and
 *   returns the given path.
 *
 * @since 1.0.0
 * @param {string} p Path to resolve
 * @returns {string} Slashed path
 */
path.addLeadingSlash = (p) => {
  if (p[0] !== '/') {
    return '/' + p
  }
  return p
}

module.exports = path
