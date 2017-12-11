'use strict'

const Dropbox = require('dropbox')
const prompt = require('prompt')
// const _ = require('lodash')

let dbx = new Dropbox()
let _devPath = '/.dotfiles/testfolder'
let _settingsPath = '~/.config/nodebox.json'
let _dbPath = '~/.config/nodebox_db.json'
let _storagePath = '~/nodebox'
let _settings = {}
let _db = []

// const utilDownload = require('./lib/downloadFileList')(dbx, filelist, _db)
const fs = require('./util/fs')
const path = require('./util/path')
const configFile = require('./util/configFile')

const ServerFileListWorker = require('./worker/ServerFileListWorker.js')

/**
 * Setup paths
 */
_settingsPath = path.expandTilde(_settingsPath)
console.log(_settingsPath)
_storagePath = path.expandTilde(_storagePath)
console.log(_storagePath)
_dbPath = path.expandTilde(_dbPath)
console.log(_dbPath)

/**
 * Read config file
 */
if (fs.existsSync(_settingsPath)) {
    _settings = configFile.readConfigFile(_settingsPath)
} else {
    configFile.writeConfigFile(_settingsPath, _settings)
}
console.log(_settings)

/**
 * Read db file
 */
if (fs.existsSync(_dbPath)) {
    _db = configFile.readConfigFile(_dbPath)
} else {
    configFile.writeConfigFile(_dbPath, _db)
}

/**
 * Setup storage folder
 */
fs.mkdirIfNotExists(_storagePath)

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
        _settings.path = result.path || _settings.path || _devPath
        configFile.writeConfigFile(_settingsPath, _settings)
    })
}

/**
 * Set access token from config file or prompt
 */
dbx.setAccessToken(_settings.accessToken)


/**
 * start serverFileListWorker
 * + fetch filelist from server (keep only in memory, since it is fetched on every startup)
 * + subscribe to longpoll endpoint and fetch changes, as soon as there are some to server filelist
 */
let serverFileListWorker = new ServerFileListWorker(dbx, _settings.path, true)

/**
 * start localFileListWorker
 * + create/update local index by analysing filesystem (including file hashes) and store to file
 */

/**
 * start mergeWorker
 * + based on filelist from server and local index create a download queue for downloadWorker
 */

/**
 * start downloadWorker
 * + download files from list created by mergeWorker
 */