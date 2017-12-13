'use strict'

const fs = require('fs')
const path = require('./path')

fs.mkdirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}
fs.walkSync = (p) => {
  if (fs.statSync(p).isDirectory()) {
    return fs.readdirSync(p).map((subPath) => {
      return fs.joinOrWalkSync(p, subPath)
    })
  } else {
    return p
  }
}

fs.joinOrWalkSync = (p, subPath) => {
    let fullPath = path.join(p, subPath)

    if (fs.statSync(fullPath).isDirectory()) {
        return fullPath
    }
    return fs.walkSync(fullPath)
}

module.exports = fs
