"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (payload) => {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
        throw new Error("Access token env variables not set");
    }
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const accessTokenExpiry = {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRY),
    };
    return jsonwebtoken_1.default.sign(payload, accessTokenSecret, accessTokenExpiry);
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    if (!process.env.REFRESH_TOKEN_SECRET || !process.env.REFRESH_TOKEN_EXPIRY) {
        throw new Error("Refresh token env variables not set");
    }
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    const refreshTokenExpiry = {
        expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRY),
    };
    return jsonwebtoken_1.default.sign(payload, refreshTokenSecret, refreshTokenExpiry);
};
exports.generateRefreshToken = generateRefreshToken;
