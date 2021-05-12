const winston = require('winston')
require('winston-daily-rotate-file')

const formats = {
    default: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
        winston.format.printf(info => {
            if (info.metadata.hasOwnProperty('durationMs')) {
                return `[${info.timestamp}] ${info.level}: ${info.message} duration: ${info.metadata.durationMs}ms`
            }

            return `[${info.timestamp}] ${info.level}: ${info.message}`
        })
    )
}

const transports = {
    console: new winston.transports.Console({
        level: 'debug',
        handleExceptions: true
    }),
    error: new winston.transports.DailyRotateFile({
        level: 'error',
        dirname: 'storage/error/',
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        handleExceptions: true
    }),
    info: new winston.transports.DailyRotateFile({
        level: 'info',
        dirname: 'storage/combined/',
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        handleExceptions: true
    })
}

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        formats.default
    ),
    transports: [
        transports.console,
        transports.error,
        transports.info
    ],
    exitOnError: false
})

module.exports = logger
