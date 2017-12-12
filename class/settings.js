'use strict'

module.exports = class NodeboxSettings {

    constructor (settingsObject) {
        if (settingsObject.devPath) {
            this.path = settingsObject.devPath || '/.dotfiles/testfolder'
        } else {
            this.path = settingsObject.path
        }

        this._settingsFolder = settingsObject.settingsFoler || '~/.config/nodebox/'
        this.settingsPath = this._settingsFolder + (settingsObject.settingsPath || 'nodebox.json')
        this.dbPath = this._settingsFolder + (settingsObject.dbPath || 'nodebox_db.json')
        this.storagePath = settingsObject.storagePath || '~/nodebox'

        this._settings = {}
        this._db = []
    }

}