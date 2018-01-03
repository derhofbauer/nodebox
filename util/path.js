'use strict'

const path = require('path')
const os = require('os')

path.expandTilde = (path) => {
  if (path.indexOf('~') > -1) {
    return path.replace('~', os.homedir())
  }
  return path
}

path.removeStaticFragment = (p, fragment) => {
  return p.replace(fragment, '')
}

path.addLeadingSlash = (p) => {
    if (p[0] !== '/') {
        return '/' + p
    }
    return p
}

module.exports = path
