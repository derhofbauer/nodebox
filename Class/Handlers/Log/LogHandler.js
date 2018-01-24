'use strict'

const winston = require('winston-color')

winston.level = process.env.LOG_LEVEL || 'error'

module.exports = winston