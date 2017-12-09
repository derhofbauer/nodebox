'use strict'

const util = require('./index')
const _ = require('lodash')

module.exports = (dbx, filelist) => {
    let module = {}

    module.downloadFileList = (path, callback) => {
        console.log('initial: filesListFolder')
        dbx.filesListFolder({
            path: path || _devPath,
            recursive: true
        })
            .then(function (response) {
                module.handleListFolderEntries(response.entries)

                module.handleListFolderContinue(response.has_more, response.cursor, callback)
            })
            .catch(function (err) {
                console.log(err)
            })
    }

    module.downloadFileListContinue = (cursor, callback) => {
        console.log('filesListFolderContinue')
        dbx.filesListFolderContinue({cursor: cursor})
            .then(function (response) {
                module.handleListFolderEntries(response.entries)

                module.handleListFolderContinue(response.has_more, response.cursor, callback)
            })
            .catch(function(err) {
                util.handleError(err)
            })
    }

    module.handleListFolderEntries = (entries, has_more, cursor) => {
        _.forEach(entries, (value) => {
            filelist.push(value)
        })
    }

    module.handleListFolderContinue = (has_more, cursor, callback) => {
        if (has_more) {
            module.downloadFileListContinue(cursor, callback)
        } else {
            callback()
        }
    }

    return module
}