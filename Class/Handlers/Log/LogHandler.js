'use strict'

const winston = require('winston')

winston.level = process.env.LOG_LEVEL || 'error'

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true,
      'level': winston.level
    })
  ]
})
