'use strict'

const fs = require('fs')
const path = require('./path')

fs.mkdirIfNotExists = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
}

fs.walkSync = (dir) => {
    if (fs.statSync(dir).isDirectory()) {
        return fs.readdirSync(dir).map((file) => {
            let fullPath = path.join(dir, file)

            if (fs.statSync(fullPath).isDirectory()) {
                return path.join(dir, file)
            } else {
                return fs.walkSync(path.join(dir, file))
            }
        })
    } else {
        return dir
    }
}

module.exports = fs