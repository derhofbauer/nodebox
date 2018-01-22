'use strict'

// Lets just run the Nodebox main method here
const Nodebox = require('./Class/Controllers/Nodebox')
const CloudStorageProvider = require('./Class/Interfaces/Storage/Provider/DropboxStorageInterfaceProvider')

const nodebox = new Nodebox(CloudStorageProvider)

// GO! :D
nodebox.go()

module.exports = nodebox