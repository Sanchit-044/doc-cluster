"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOtp = exports.loginOtp = void 0;
const customError_1 = require("../types/customError");
const prisma_1 = require("../config/prisma");
const loginOtp = async (req, res, next) => {
    try {
        let { email } = req.body;
        if (!email || typeof email !== "string") {
            return next(new customError_1.CustomError("Email is required", 400));
        }
        email = email.trim().toLowerCase();
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return next(new customError_1.CustomError("User not found", 404));
        }
        if (!user.isVerified) {
            return next(new customError_1.CustomError("User not verified. Please verify your email first.", 403));
        }
        req.type = "login";
        next();
    }
    catch (error) {
        console.error("LOGIN OTP ERROR:", error);
        next(new customError_1.CustomError("Something went wrong while processing login OTP", 500, error.message));
    }
};
exports.loginOtp = loginOtp;
const registerOtp = async (req, res, next) => {
    try {
        let { email } = req.body;
        if (!email || typeof email !== "string") {
            return next(new customError_1.CustomError("Email is required", 400));
        }
        email = email.trim().toLowerCase();
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            if (existingUser.isVerified) {
                return next(new customError_1.CustomError("Email already registered and verified", 409));
            }
            else {
                return next(new customError_1.CustomError("Email already registered but not verified", 409));
            }
        }
        req.type = "register";
        next();
    }
    catch (error) {
        console.error("REGISTER OTP ERROR:", error);
        next(new customError_1.CustomError("Something went wrong while processing register OTP", 500, error.message));
    }
};
exports.registerOtp = registerOtp;
