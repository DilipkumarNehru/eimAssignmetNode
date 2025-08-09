'use strict';

let Status = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_FAILED: 422,
    SERVER_ERROR: 500,
    CREATED: 201
};

function statusMessage(status) {
    switch (status) {
        case Status.BAD_REQUEST:
            return 'Bad Request';
        case Status.UNAUTHORIZED:
            return 'Unauthorized';
        case Status.FORBIDDEN:
            return 'Forbidden';
        case Status.NOT_FOUND:
            return 'Not Found';
        case Status.VALIDATION_FAILED:
            return 'Validation Failed';
        case Status.SERVER_ERROR:
            return 'Internal Server Error';
        case Status.CREATED:
            return 'Created';
        default:
            return 'OK';
    }
}

function jsonResponse(res, body, options, msg, err_code) {
    options = options || {};
    options.status = options.status || Status.OK;
    res.status(options.status).json({
        error_code: err_code,
        msg: msg,
        output: body || null,
        timestamp: new Date().toISOString()
    });
}

const Api = {
    ok: function (req, res, data, msg, err_code) {
        jsonResponse(res, data, {
            status: Status.OK,
        }, msg, err_code);
    },

    badRequest: function (req, res, errors) {
        errors = Array.isArray(errors) ? errors : [errors];
        let body = {
            message: statusMessage(Status.BAD_REQUEST),
            errors: errors
        };
        jsonResponse(res, body, {
            status: Status.BAD_REQUEST
        });
    },

    unauthorized: function (req, res, error) {
        let body = {
            message: statusMessage(Status.UNAUTHORIZED),
            error: error
        };
        jsonResponse(res, body, {
            status: Status.UNAUTHORIZED
        });
    },

    notFound: function (req, res, message) {
        let body = {
            message: message || statusMessage(Status.NOT_FOUND)
        };
        jsonResponse(res, body, {
            status: Status.NOT_FOUND
        });
    },

    invalid: function (req, res, errors) {
        errors = Array.isArray(errors) ? errors : [errors];
        let body = {
            message: statusMessage(Status.VALIDATION_FAILED),
            errors: errors
        };
        jsonResponse(res, body, {
            status: Status.VALIDATION_FAILED
        });
    },

    serverError: function (req, res, error) {
        if (error instanceof Error) {
            error = {
                message: error.message,
                stacktrace: error.stack
            };
        }

        let body = {
            message: statusMessage(Status.SERVER_ERROR),
            error: error
        };
        jsonResponse(res, body, {
            status: Status.SERVER_ERROR
        });
    },

    created: function (req, res, data, msg) {
        jsonResponse(res, data, {
            status: Status.CREATED
        }, msg || 'Created successfully');
    }
};

module.exports = Api;
