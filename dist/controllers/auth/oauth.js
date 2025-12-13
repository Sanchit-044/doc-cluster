"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = exports.githubOauthCallback = exports.startGithubOauth = exports.googleOauthCallback = exports.startGoogleOauth = void 0;
const prisma_1 = require("../../config/prisma");
const types_1 = require("../../types");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ua_parser_js_1 = require("ua-parser-js");
const passport_config_1 = __importDefault(require("../../config/passport.config"));
const startGoogleOauth = (req, res, next) => {
    passport_config_1.default.authenticate("google", {
        scope: ["profile", "email"],
    })(req, res, next);
};
exports.startGoogleOauth = startGoogleOauth;
const googleOauthCallback = (req, res, next) => {
    passport_config_1.default.authenticate("google", { session: false }, (err, user) => {
        if (err) {
            next(new types_1.CustomError("An error occurred", 500, err.message));
            return;
        }
        if (!user) {
            next(new types_1.CustomError("User not found", 404));
            return;
        }
        res.redirect(`${process.env.FRONTEND_URL}/google?token=${user.tempOAuthToken}`);
    })(req, res, next);
};
exports.googleOauthCallback = googleOauthCallback;
const startGithubOauth = (req, res, next) => {
    passport_config_1.default.authenticate("github", {
        scope: ["user:email"],
    })(req, res, next);
};
exports.startGithubOauth = startGithubOauth;
const githubOauthCallback = (req, res, next) => {
    passport_config_1.default.authenticate("github", { session: false }, (err, user) => {
        if (err) {
            next(new types_1.CustomError("An error occurred", 500, err.message));
            return;
        }
        if (!user) {
            next(new types_1.CustomError("User not found", 404));
            return;
        }
        res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${user.tempOAuthToken}`);
    })(req, res, next);
};
exports.githubOauthCallback = githubOauthCallback;
const generateTokens = async (req, res, next) => {
    try {
        const { tempOAuthToken } = req.body;
        if (!tempOAuthToken) {
            next(new types_1.CustomError("Invalid token", 400));
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempOAuthToken, process.env.TEMP_JWT_SECRET);
        }
        catch (error) {
            next(new types_1.CustomError("Invalid token", 400));
            return;
        }
        const email = decoded?.email;
        if (!email) {
            next(new types_1.CustomError("Invalid token payload", 400));
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            next(new types_1.CustomError("User not found", 404));
            return;
        }
        if (user.tempOAuthToken !== tempOAuthToken) {
            next(new types_1.CustomError("Invalid token", 400));
            return;
        }
        const accessTokenKey = process.env.ACCESS_TOKEN_SECRET;
        const refreshTokenKey = process.env.REFRESH_TOKEN_SECRET;
        if (!accessTokenKey || !refreshTokenKey) {
            next(new types_1.CustomError("Something went wrong", 500));
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, version: user.version }, accessTokenKey, { expiresIn: "7d" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, version: user.version }, refreshTokenKey, { expiresIn: "30d" });
        const userAgent = String(req.headers["user-agent"] || "Unknown");
        const parser = new ua_parser_js_1.UAParser(userAgent);
        const uaDetails = parser.getResult();
        const forwardedFor = Array.isArray(req.headers["x-forwarded-for"])
            ? req.headers["x-forwarded-for"][0]
            : req.headers["x-forwarded-for"];
        const ip = forwardedFor?.toString().split(",")[0]?.trim() || req.ip || "Unknown";
        const sessionData = {
            userId: user.id,
            token: accessToken,
            expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
            refreshToken: refreshToken,
            refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: ip,
            userAgent: userAgent,
            location: ip,
            device: String(req.headers["x-device"] || uaDetails.device?.model || "Unknown"),
            browser: String(req.headers["x-browser"] || uaDetails.browser?.name || "Unknown"),
            os: String(req.headers["x-os"] || uaDetails.os?.name || "Unknown"),
        };
        await Promise.all([
            prisma_1.prisma.session.create({ data: sessionData }),
            prisma_1.prisma.user.update({ where: { email }, data: { tempOAuthToken: null } }),
        ]);
        res.status(200).send({
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
                    refreshToken,
                },
            },
        });
    }
    catch (error) {
        const e = error;
        next(new types_1.CustomError("Something went wrong", 500, e.message));
    }
};
exports.generateTokens = generateTokens;
