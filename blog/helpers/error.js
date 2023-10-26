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

export class PostExistsError extends HTTPError {
    constructor(message) {
        super(409, message)
    }
}

export class MarkdownGenerationError extends HTTPError {
    constructor(message) {
        super(500, message)
    }
}

export class PostDoesntExistError extends HTTPError {
    constructor(message) {
        super(404, message)
    }
}