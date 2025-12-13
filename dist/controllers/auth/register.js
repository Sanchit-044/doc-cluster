"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../config/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const types_1 = require("../../types");
const registerUser = async (req, res, next) => {
    try {
        let { email, password, username } = req.body;
        email = email?.trim().toLowerCase();
        password = password?.trim();
        username = username?.trim();
        if (!email || !password || !username) {
            return next(new types_1.CustomError("Email, password and username are required", 400));
        }
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser?.isVerified) {
            return next(new types_1.CustomError("Email already exists", 400));
        }
        if (existingUser && !existingUser.isVerified) {
            await prisma_1.prisma.user.delete({
                where: { id: existingUser.id },
            });
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // FIX: Convert DOB if present
        let DOB = undefined;
        if (req.body.DOB) {
            DOB = new Date(req.body.DOB);
            if (isNaN(DOB.getTime())) {
                return next(new types_1.CustomError("Invalid DOB format", 400));
            }
        }
        await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                DOB,
                isVerified: true
            },
        });
        // return sendOtpEmail(req, res, next);
    }
    catch (error) {
        console.error("REGISTER USER ERROR:", error);
        const err = error;
        return next(new types_1.CustomError("Something went wrong", 500, err.message));
    }
};
exports.default = registerUser;
