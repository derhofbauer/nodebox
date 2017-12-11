'use strict'

const fs = require('fs')

fs.mkdirIfNotExists = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
}

module.exports = fs