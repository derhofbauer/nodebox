'use strict'

const crypto = require('crypto')
const fs = require('fs')

const LogHandler = require('../Handlers/Log/LogHandler')

/**
 * Block size of Dropbox hash chunks
 * @const
 */
const BLOCK_SIZE = 4 * 1024 * 1024 // 4MB

/**
 * Hash given file in blocks of 4MB (https://www.dropbox.com/developers/reference/content-hash).
 *
 * This Class is based upon the Dropbox sample class:
 *   https://github.com/dropbox/dropbox-api-content-hasher/blob/master/js-node/dropbox-content-hasher.js
 *
 * @type {FileHasher}
 * @since 1.0.0
 */
module.exports = class FileHasher {
  /**
   * Hash file found at `absolutePath`
   * @param {string} absolutePath Filepath to be hashed
   * @return {Promise} Promise resolving to `absolutePath` hash
   */
  constructor (absolutePath) {
    /**
     * Hasher for sum of chunk hashes
     * @member {Hash}
     */
    this._overallHasher = crypto.createHash('sha256')

    /**
     * Hasher for single chunk hashes
     * @member {Hash}
     */
    this._blockHasher = crypto.createHash('sha256')

    /**
     * Pointer in current chunk
     * @member {number}
     */
    this._pointer = 0

    /**
     * Path to file that is to be hashed
     * @member {string}
     */
    this.path = absolutePath

    /**
     * Buffer for hash generation
     * @member {(null|Buffer)}
     */
    this.data = null

    /**
     * Stream of file content
     * @member {fs.ReadStream}
     */
    this.stream = fs.createReadStream(this.path)

    /**
     * Hexadecimal Hash of file
     * @member{string}
     */
    this.hexDigest = ''

    LogHandler.debug('Hashing', this.path)

    return new Promise((resolve, reject) => {
      this.stream.on('data', (buffer) => {
        LogHandler.silly(`Receiving ${buffer.length} bytes of data.`)
        this.update(buffer)
      })
      this.stream.on('end', (err) => {
        if (err) {
          LogHandler.error(err)
        }
        this.hexDigest = this.digest('hex')
                // LogHandler.log('hexDigest:', this.hexDigest)
        resolve(this.hexDigest)
      })
      this.stream.on('error', (err) => {
        LogHandler.error('Error reading from file: ', err)
        reject(err)
      })
    })
  }

  /**
   * Updates this._blockHaser or this._overallHasher according to this._pointer
   *   value.
   * @param {Buffer} data Stream of current chunk
   * @param {string} inputEncoding Hash encoding
   */
  update (data, inputEncoding) {
    this.checkOverallHasher()

    this.prepareBuffer(data, inputEncoding)

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

      this._pointer += inputPartLength
      offset = inputPartEnd
    }
  }

  /**
   * Generate overall hash and reset this._blockHasher and this._overallHasher
   * @param {string} encoding Hash encoding
   * @returns {string} Hash of file content
   */
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

  /**
   * Helper method to check this._overallHasher
   */
  checkOverallHasher () {
    if (this._overallHasher === null) {
      throw new Error('can\'t use this object anymore; .digest() was called already.')
    }
  }

  /**
   * Helper method to validate encoding
   * @param {string} encoding
   * @throws {Error} Will throw an error if wrong encoding was given.
   */
  checkInputEncoding (encoding) {
    if (encoding !== undefined &&
          encoding !== 'utf8' &&
          encoding !== 'ascii' &&
          encoding !== 'latin1'
      ) {
      throw new Error('Invalid \'input encoding\': ' + JSON.stringify(encoding))
    }
  }

  /**
   * Helper method to prepare stream buffer (this.data)
   * @param {Buffer} data Buffer to prepare
   * @param {string} encoding Stream encoding to use for reading the file
   */
  prepareBuffer (data, encoding) {
    this.data = data
    if (!Buffer.isBuffer(data)) {
      this.checkInputEncoding(encoding)

      this.data = Buffer.from(data, encoding)
    }
  }
}
