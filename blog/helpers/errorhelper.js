export class HTTPError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

export class AuthenticationError extends HTTPError {
    constructor(message) {
        super(403, message)
    }
}