'use strict'

const Dropbox = require('dropbox')
const prompt = require('prompt')

let dbx = new Dropbox()
let _db = []

// const utilDownload = require('./lib/downloadFileList')(dbx, filelist, _db)
const fs = require('./util/fs')
const configFile = require('./util/configFile')

const Settings = require('./class/settings')

const ServerFileListWorker = require('./worker/ServerFileListWorker')
const LocalFileListWorker = require('./worker/LocalFileListWorker')
const MergeWorker = require('./worker/MergeWorker')

/**
 * Settings
 */
let settings = new Settings({
    path: '/.dotfiles/testfolder'
})
console.info('Settings:', settings.get())

/**
 * Read db file
 */
if (fs.existsSync(settings.get('dbPath'))) {
    _db = configFile.readConfigFile(settings.get('dbPath'))
} else {
    configFile.writeConfigFile(settings.get('dbPath'), _db)
}

/**
 * Setup storage folder
 */
fs.mkdirIfNotExists(settings.get('storagePath'))



/**
 * @todo: refactor this to a beautiful class with a .go()/.start() method. This has the benefit of being able to create
 * @todo: the nodebox instance outside of the prompt logic but starting it inside when the prompt has finished or no
 * @todo: prompt is required since we got everything we need.
 */
let go = function run() {

    if (settings.get('accessToken')) {
        /**
         * Set access token from config file or prompt
         */
        dbx.setAccessToken(settings.get('accessToken'))

        /**
         * start serverFileListWorker
         * + fetch filelist from server (keep only in memory, since it is fetched on every startup)
         * + subscribe to longpoll endpoint and fetch changes, as soon as there are some to server filelist
         */
        let serverFileListWorker = new ServerFileListWorker(dbx, settings, true)


        /**
         * start localFileListWorker
         * + create/update local index by analysing filesystem (including file hashes) and store to file
         */
        let localFileListWorker = new LocalFileListWorker(dbx, settings.get('storagePath'), settings.get('dbPath'), true)

        /**
         * start mergeWorker
         * + based on filelist from server and local index create a download queue for downloadWorker
         */
        let mergeWorker = new MergeWorker(serverFileListWorker, localFileListWorker)

        /**
         * start downloadWorker
         * + download files from list created by mergeWorker
         */
    }

}


/**
 * Get Access Token
 */
if (!settings.get('accessToken')) {
    prompt.start()

    prompt.get({
        properties: {
            accessToken: {
                description: 'Please enter a valid API V2 access token'
            },
            path: {
                description: 'Please enter a valid path within your dropbox (default: "' + settings.get('path') + '")'
            }
        }
    }, (error, result) => {
        settings.set('accessToken', result.accessToken)
        settings.set('path', result.path || settings.get('path'))
        settings.persist()

        go()
    })
} else {
    go()
}