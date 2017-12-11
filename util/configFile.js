'use strict'

const fs = require('fs')

module.exports = {
    writeConfigFile: (file, configObject) => {
        let content = JSON.stringify(jsonContent) || ''

        fs.writeFile(file, content, {flag: 'w+'}, function(err) {
            errorHandler.handle(err)
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