'use strict'

const _ = require('lodash')
const path = require('../util/path')

module.exports = class NodeboxSettings {

    constructor (settingsObject) {
        if (settingsObject.devPath) {
            this.path = settingsObject.devPath || '/.dotfiles/testfolder'
        } else {
            this.path = settingsObject.path
        }

        // this._settingsFolder = settingsObject.settingsFoler || '~/.config/nodebox/'
        // this.settingsPath = this._settingsFolder + (settingsObject.settingsPath || 'nodebox.json')
        // this.dbPath = this._settingsFolder + (settingsObject.dbPath || 'nodebox_db.json')
        // this.storagePath = settingsObject.storagePath || '~/nodebox'

        this._defaults = {
            settingsFolder: path.expandTilde('~/.config/nodebox/'),
            settingsPath: path.expandTilde('~/.config/nodebox/nodebox.json'),
            dbPath: path.expandTilde('~/.config/nodebox/nodebox_db.json'),
            storagePath: path.expandTilde('~/nodebox'),
            path: path.expandTilde('/'),
            accessToken: null,
            lastCursor: null
        }

        this._settings = _.merge(this._defaults, settingsObject)
        this._db = []
    }

    getAll () {
        return this._settings
    }

    get (name) {
        return this._settings[name]
    }

    set (name, value) {
        this._settings[name] = value
    }

}