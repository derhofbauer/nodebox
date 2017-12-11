'use strict'

const path = require('path')
const os = require('os')

module.exports.expandTilde = (path) => {
    if (path.indexOf('~') > -1) {
        return path.replace('~', os.homedir())
    }
    return path
}