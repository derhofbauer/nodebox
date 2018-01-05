'use strict'

const Dropbox = require('dropbox')
const prompt = require('prompt')

let dbx = new Dropbox()

const fs = require('./util/fs')

const Db = require('./class/db')

const ServerFileListWorker = require('./worker/ServerFileListWorker')
const LocalFileListWorker = require('./worker/LocalFileListWorker')
const MergeWorker = require('./worker/MergeWorker')

/**
 * Settings
 */
let db = new Db({
  path: '/.dotfiles/testfolder'
})
console.info('DB:', db.getAll())

/**
 * Read db file
 */
// if (fs.existsSync(settings.get('dbPath'))) {
//   _db = configFile.readConfigFile(settings.get('dbPath'))
// } else {
//   configFile.writeConfigFile(settings.get('dbPath'), _db)
// }

/**
 * Setup storage folder
 */
console.info('StoragePath: ', db.getSettings('storagePath'))
fs.mkdirIfNotExists(db.getSettings('storagePath'))

/**
 * @todo: refactor this to a beautiful class with a .go()/.start() method. This has the benefit of being able to create
 * @todo: the nodebox instance outside of the prompt logic but starting it inside when the prompt has finished or no
 * @todo: prompt is required since we got everything we need.
 */
let go = function run () {
  if (db.getSettings('accessToken')) {
        /**
         * Set access token from config file or prompt
         */
    dbx.setAccessToken(db.getSettings('accessToken'))

        /**
         * start serverFileListWorker
         * + fetch filelist from server (keep only in memory, since it is fetched on every startup)
         * + subscribe to longpoll endpoint and fetch changes, as soon as there are some to server filelist
         */
    let serverFileListWorker = new ServerFileListWorker(dbx, db, true)

        /**
         * start localFileListWorker
         * + create/update local index by analysing filesystem (including file hashes) and store to file
         */
    let localFileListWorker = new LocalFileListWorker(dbx, db, true)

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
if (!db.getSettings('accessToken')) {
  prompt.start()

  prompt.get({
    properties: {
      accessToken: {
        description: 'Please enter a valid API V2 access token'
      },
      path: {
        description: 'Please enter a valid path within your dropbox (default: "' + db.getSettings('path') + '")'
      }
    }
  }, (error, result) => {
    if (error) {
      console.log(error)
    }

    db.setSetting('accessToken', result.accessToken)
    if (result.path) {
      db.setSetting('path', result.path)
    }

    go()
  })
} else {
  go()
}
