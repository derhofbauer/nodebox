'use strict'

const fs = require('fs')
const os = require('os')
const _ = require('lodash')

module.exports = (dbx) => {
    let module = {}

    module.handleError = (err) => {
        console.log(err)
    }
    module.mkdirIfNotExists = (dir) => {
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    }
    module.writeConfigFile = (file, jsonContent) => {
        let content = JSON.stringify(jsonContent) || ''

        fs.writeFile(file, content, {flag: 'w+'}, function(err) {
            console.log(err)
        })
    }
    module.expandTilde = (path) => {
        if (path.indexOf('~') > -1) {
            return path.replace('~', os.homedir())
        }
        return path
    }
    module.readConfigFile = (file) => {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file)
            return JSON.parse(content)
        }
        return {}
    }
    module.setAccessToken = (_settings) => {
        dbx.setAccessToken(_settings.accessToken)
        console.log('Access token accepted')
    }

    return module
}