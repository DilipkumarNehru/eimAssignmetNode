class ResponseHelper {
    constructor() {
        // Initialize any required properties
    }

    success(res, data, message = null, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        });
    }

    error(res, message, statusCode = 500, details = null) {
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    badRequest(res, message, details = null) {
        return this.error(res, message, 400, details);
    }

    notFound(res, message, suggestion = null) {
        return res.status(404).json({
            success: false,
            error: message,
            suggestion: suggestion,
            timestamp: new Date().toISOString()
        });
    }

    serverError(res, message, details = null) {
        return this.error(res, message, 500, details);
    }

    unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseHelper;
