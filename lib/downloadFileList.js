'use strict'

const _ = require('lodash')
const fs = require('fs')
const os = require('os')
const path = require('path')

const errorHandler = require('../util/errorHandler')
const fsExtended = require('../util/fs')

module.exports = (dbx, filelist, _db) => {
    let module = {}

    module.downloadFileList = (path, callback) => {
        console.log('initial: filesListFolder')
        dbx.filesListFolder({
            path: path || _devPath,
            recursive: true,
            include_deleted: false,
            include_media_info: false
        })
            .then(function (response) {
                module.handleListFolderEntries(response.entries)

                module.handleListFolderContinue(response.has_more, response.cursor, callback)
            })
            .catch(function (err) {
                errorHandler.handle(err)
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
                errorHandler.handle(err)
            })
    }

    module.handleListFolderEntries = (entries, has_more, cursor) => {
        _.forEach(entries, function(value) {
            _db[value.id] = {
                path: value.path_display,
                type: value['.tag']
            }
        })
    }

    module.handleListFolderContinue = (has_more, cursor, callback) => {
        if (has_more) {
            module.downloadFileListContinue(cursor, callback)
        } else {
            callback(_db)
        }
    }

    module.downloadWorker = (filelist, callback) => {
        let interval = setInterval(() => {
            _.forEach(filelist, function(path, id) {
                if (path.type === 'folder') {
                    fsExtended.mkdirIfNotExists(path.path)
                }
                if (path.type === 'file') {
                    if (!fs.existsSync(path.path)) {
                        module.downloadFile(id)
                    }
                    if (fs.existsSync(path.path)) {
                        // create checksum and verify that downloading a new version is neccessary using dbx.get_metadata
                    }
                }
            })
        }, 1000 * 1)
    }

    module.downloadFile = (path) => {
        dbx.download({
            path: path
        })
            .then(function(data) {
                _db[data.id].content_hash = data.content_hash
                mkdirp(path.dirname(data.path_display), function(err) {
                    if (err) {throw err}

                    fs.writeFile(data.path_display, data.fileBinary, 'binary', function(err) {
                        if (err) { throw err }
                        console.log('File: ' + data.name + ' saved.')
                    })
                })
            })
            .catch(function(err) {
                errorHandler.handle(err)
            })
    }

    return module
}