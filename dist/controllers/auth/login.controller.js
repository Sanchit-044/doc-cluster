"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../config/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../../types/index");
const COOKIE_NAME = process.env.COOKIE_NAME;
const REFRESH_TOKEN_EXPIRES_MS = Number(process.env.REFRESH_TOKEN_COOKIE_EXP_MS);
const loginUser = async (req, res, next) => {
    try {
        let { email, username, password } = req.body ?? {};
        email = email?.trim();
        username = username?.trim();
        password = password?.trim();
        if ((!email && !username) || !password) {
            next(new index_1.CustomError("Email or username and password are required", 400));
            return;
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    email ? { email: email.toLowerCase() } : undefined,
                    username ? { username } : undefined,
                ].filter(Boolean),
            },
        });
        if (!user || !user.isVerified) {
            next(new index_1.CustomError("User not found or not verified", 401));
            return;
        }
        if (!user.password) {
            next(new index_1.CustomError("Password not set for this account", 401));
            return;
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            next(new index_1.CustomError("Invalid password", 401));
            return;
        }
        const accessTokenKey = process.env.ACCESS_TOKEN_SECRET;
        const refreshTokenKey = process.env.REFRESH_TOKEN_SECRET;
        if (!accessTokenKey || !refreshTokenKey) {
            next(new index_1.CustomError("Server configuration error", 500));
            return;
        }
        const payload = { userId: user.id, version: 0 };
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, }, accessTokenKey, { expiresIn: "1d" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, }, refreshTokenKey, { expiresIn: "7d" });
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: REFRESH_TOKEN_EXPIRES_MS,
            path: "/",
        };
        res.cookie(COOKIE_NAME, refreshToken, cookieOptions);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    isVerified: user.isVerified,
                },
                tokens: {
                    accessToken,
                }
            },
        });
    }
    catch (error) {
        const err = error;
        next(new index_1.CustomError("Something went wrong", 500, `${err.message}`));
    }
};
exports.default = loginUser;
