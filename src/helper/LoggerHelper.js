const winston = require('winston');
const path = require('path');

class LoggerHelper {
    constructor() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'procurement-api' },
            transports: [
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../logs/error.log'), 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../logs/combined.log') 
                }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });

        // Create logs directory if it doesn't exist
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const fs = require('fs');
        const logDir = path.join(__dirname, '../logs');
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    http(message, meta = {}) {
        this.logger.http(message, meta);
    }
}

module.exports = LoggerHelper;
