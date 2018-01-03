'use strict'

const crypto = require('crypto')
const fs = require('fs')

const BLOCK_SIZE = 4 * 1024 * 1024

/**
 * Hash given file in blocks of 4MB (https://www.dropbox.com/developers/reference/content-hash).
 *
 * This Class is based upon the Dropbox sample class:
 *   https://github.com/dropbox/dropbox-api-content-hasher/blob/master/js-node/dropbox-content-hasher.js
 *
 * @since 1.0.0
 * @param {string} p Filepath to be hashed
 * @return {string} Hash of p
 */
module.exports = class FileHasher {

    constructor (p) {
        this._overallHasher = crypto.createHash('sha256')
        this._blockHasher = crypto.createHash('sha256')
        this._pointer = 0

        this.path = p
        this.data = null
        this.stream = fs.createReadStream(this.path)
        this.hexDigest = ''

        console.log('Path:', this.path)

        // return this.hash()

        this.stream.on('data', (buffer) => {
            this.update(buffer)
         })
        this.stream.on('end', (err) => {
            this.hexDigest = this.digest('hex')
            console.log('hexDigest:', this.hexDigest)
            })
        this.stream.on('error', (err) => {
            console.log('Error reading from file: ', err)
        })

        return this.hexDigest
    }

    update (data, inputEncoding) {
        this.checkOverallHasher()

        if (!Buffer.isBuffer(data)) {
            if (inputEncoding !== undefined &&
                inputEncoding !== 'utf8' &&
                inputEncoding !== 'ascii' &&
                inputEncoding !== 'latin1'
            ) {
                throw new Error('Invalid \'input encoding\': ' + JSON.stringify(inputEncoding))
            }
            this.data = Buffer.from(data, inputEncoding)
        }

        let offset = 0
        while (offset < this.data.length) {
            if (this._pointer === BLOCK_SIZE) {
                this._overallHasher.update(this._blockHasher.digest())
                this._blockHasher = crypto.createHash('sha256')
                this._pointer = 0
            }

            let spaceInBlock = BLOCK_SIZE - this._pointer
            let inputPartEnd = Math.min(this.data.length, offset + spaceInBlock)
            let inputPartLength = inputPartEnd - offset
            this._blockHasher.update(data.slice(offset, inputPartEnd))

            this._pointer += inputPartEnd
            offset = inputPartEnd
        }
    }

    digest (encoding) {
        this.checkOverallHasher()

        if (this._pointer > 0) {
            this._overallHasher.update(this._blockHasher.digest())
            this._blockHasher = null
        }
        let r = this._overallHasher.digest(encoding)
        this._overallHasher = null
        return r
    }

    checkOverallHasher () {
        if (this._overallHasher === null) {
            throw new AssertionError(
                'can\'t use this object anymore; .digest() was called already.'
            )
        }
    }

    hash () {
        this.stream.on('data', (buffer) => {
            this.update(buffer)
        })
        this.stream.on('end', (err) => {
            this.hexDigest = this.digest('hex')
            return this.hexDigest
            console.log(this.hexDigest)
        })
        this.stream.on('error', (err) => {
            console.log('Error reading from file: ', err)
        })
    }

    getHex () {
        return this.hexDigest
    }
}