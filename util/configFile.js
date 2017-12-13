'use strict'

const fs = require('fs')
const errorHandler = require('./errorHandler')

module.exports = {
    writeConfigFile: (file, configObject) => {
        let content = JSON.stringify(configObject) || ''

        fs.writeFile(file, content, {flag: 'w+'}, (err) => {
            if (err) {
                errorHandler.handle(err)
            }
        })
    },

    readConfigFile: (file) => {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file)
            return JSON.parse(content)
        }
        return false
    }
}