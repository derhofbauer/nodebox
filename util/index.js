'use strict'

const fs = require('fs')
const os = require('os')
const _ = require('lodash')

module.exports = {
    handleError: (err) => {
        console.log(err)
    },
    handleListFolderEntries: (filelist, entries, has_more, cursor) => {
        _.forEach(entries, (value) => {
            filelist.push(value)
        })
        if (has_more) {
            downloadFileListContinue(cursor)
        } else {
            console.log(filelist.length)
        }
    },
    mkdirIfNotExists: (dir) => {
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    },
    writeConfigFile: (file, jsonContent) => {
        let content = JSON.stringify(jsonContent) || ''

        fs.writeFileSync(file, content, {flag: 'w+'}, function(err) {
            console.log(err)
        })
    },
    expandTilde: (path) => {
        if (path.indexOf('~') > -1) {
            return path.replace('~', os.homedir())
        }
        return path
    },
    readConfigFile: (file) => {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file)
            return JSON.parse(content)
        }
        return {}
    }
}