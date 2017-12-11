'use strict'

const path = require('path')
const os = require('os')

path.expandTilde = (path) => {
    if (path.indexOf('~') > -1) {
        return path.replace('~', os.homedir())
    }
    return path
}

module.exports = path