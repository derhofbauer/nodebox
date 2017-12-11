'use strict'

const fs = require('fs')

module.exports.mkdirIfNotExists = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
}