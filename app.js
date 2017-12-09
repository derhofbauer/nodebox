//'use strict'

const fs = require('fs')
const Dropbox = require('dropbox')
const prompt = require('prompt')
const _ = require('lodash')

const util = require('./util')

let dbx = new Dropbox()
let filelist = []
let _devPath = '/.dotfiles'
let _settingsPath = '~/.config/nodebox.json'
let _storagePath = '~/nodebox'
let _settings = {}

/**
 * Setup folders
 */
_settingsPath = util.expandTilde(_settingsPath)
console.log(_settingsPath)
_storagePath = util.expandTilde(_storagePath)
console.log(_storagePath)

_setting = util.readConfigFile(_settingsPath)
util.writeConfigFile(_settingsPath, _settings)
util.mkdirIfNotExists(_storagePath)

console.log(_settings)

/**
 * Get Access Token
 */
if (!_settings.accessToken) {
    prompt.start()

    prompt.get({
        properties: {
            accessToken: {
                description: 'Please enter a valid API V2 access token'
            },
            path: {
                description: 'Please enter a valid path within your dropbox (default: "' + _devPath + '")'
            }
        }
    }, (error, result) => {
        _settings.accessToken = result.accessToken
        util.writeConfigFile(_settingsPath, _settings)

        dbx.setAccessToken(result.accessToken)
        console.log('Access token accepted')

        downloadFileList(result.path)
    })
}

/**
 * Download File List
 */
let downloadFileList = (path) => {
    console.log('initial: filesListFolder')
    dbx.filesListFolder({
        path: path || _devPath,
        recursive: true
    })
    .then(function (response) {
        util.handleListFolderEntries(filelist, response.entries, response.has_more, response.cursor)
    })
    .catch(function (err) {
        util.handleError(err)
    })
}

let downloadFileListContinue = (cursor) => {
    console.log('filesListFolerContinue')
    dbx.filesListFolderContinue({cursor: cursor})
        .then(function (response) {
            util.handleListFolderEntries(filelist, response.entries, response.has_more, response.cursor)
        })
        .catch(function(err) {
            util.handleError(err)
        })
}