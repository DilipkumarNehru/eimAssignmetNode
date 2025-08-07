const LoggerHelper = require('../helper/LoggerHelper');

class ErrorHandler {
    constructor() {
        this.logger = new LoggerHelper();
    }

    handleError(err, req, res, next) {
        this.logger.error('Unhandled error:', {
            error: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });

        // Default error response
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        res.status(err.statusCode || 500).json({
            success: false,
            error: 'Internal server error',
            message: isDevelopment ? err.message : 'Something went wrong',
            ...(isDevelopment && { stack: err.stack }),
            timestamp: new Date().toISOString()
        });
    }
}

const errorHandler = new ErrorHandler();

module.exports = (err, req, res, next) => {
    errorHandler.handleError(err, req, res, next);
};
