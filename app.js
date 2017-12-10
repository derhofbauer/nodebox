//'use strict'

const fs = require('fs')
const Dropbox = require('dropbox')
const prompt = require('prompt')
const _ = require('lodash')

let dbx = new Dropbox()
let filelist = []
let _devPath = '/.dotfiles'
let _settingsPath = '~/.config/nodebox.json'
let _dbPath = '~/.config/nodebox_db.json'
let _storagePath = '~/nodebox'
let _settings = {}
let _db = []

const util = require('./util')(dbx)
const utilDownload = require('./util/downloadFileList')(dbx, filelist, _db)

/**
 * Setup paths
 */
_settingsPath = util.expandTilde(_settingsPath)
console.log(_settingsPath)
_storagePath = util.expandTilde(_storagePath)
console.log(_storagePath)
_dbPath = util.expandTilde(_dbPath)
console.log(_dbPath)

/**
 * Read config file
 */
if (fs.existsSync(_settingsPath)) {
    _settings = util.readConfigFile(_settingsPath)
} else {
    util.writeConfigFile(_settingsPath, _settings)
}
console.log(_settings)

/**
 * Read db file
 */
if (fs.existsSync(_dbPath)) {
    _db = util.readConfigFile(_dbPath)
} else {
    util.writeConfigFile(_dbPath, _db)
}

/**
 * Setup storage folder
 */
util.mkdirIfNotExists(_storagePath)

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
        _settings.path = result.path || _devPath
        util.writeConfigFile(_settingsPath, _settings)
    })
}

/**
 * Set access token from config file or prompt
 */
util.setAccessToken(_settings, dbx)

/**
 * setInterval
 */
let daemon = setInterval(function() {
    /**
     * Download File List
     */
    utilDownload.downloadFileList(_settings.path, function(filelist) {
        _db = filelist
        util.writeConfigFile(_dbPath, _db)

        console.log(_db)
    })
}, 1000 * 60)

/**
 * Download files
 */
utilDownload.downloadWorker(filelist, function(path) {
    console.log(path + "downloaded.")
})