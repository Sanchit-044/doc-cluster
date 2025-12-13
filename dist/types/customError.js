"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode, error) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
    }
}
exports.CustomError = CustomError;
exports.default = CustomError;
