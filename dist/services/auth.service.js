"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordService = exports.refreshTokenService = exports.loginService = exports.registerService = void 0;
const prisma_1 = require("../config/prisma");
const hash_1 = require("../utils/hash");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const registerService = async (data) => {
    const { fullName, email, username, phoneNumber, DOB, password } = data;
    try {
        console.log("Fullame", fullName);
        const exists = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
            select: { id: true },
        });
        console.log("exitst", exists);
        if (exists)
            return { error: "User with email/username already exists" };
    }
    catch (error) {
        console.log("error in db", error);
    }
    const hashedPassword = await (0, hash_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: {
            fullName,
            email,
            username,
            phoneNumber,
            DOB: DOB ? new Date(DOB) : undefined,
            password: hashedPassword,
            isVerified: false,
            avatarUrl: "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg",
            avatarId: "/",
            coverInfo: {},
        },
    });
    return {
        user: {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            isVerified: false,
            avatarUrl: user.avatarUrl,
            avatarId: user.avatarId,
            coverInfo: user.coverInfo,
        },
    };
};
exports.registerService = registerService;
const loginService = async (identifier, password) => {
    let query = {};
    if (/^\d{10}$/.test(identifier))
        query.phoneNumber = identifier;
    else if (identifier.includes("@"))
        query.email = identifier;
    else
        query.username = identifier.toLowerCase();
    const user = await prisma_1.prisma.user.findFirst({
        where: query,
    });
    if (!user)
        return { error: "User not found" };
    if (!user.password)
        return { error: "Invalid user record" };
    const passwordMatch = await bcrypt_1.default.compare(password, user.password);
    if (!passwordMatch)
        return { error: "Incorrect password" };
    if (!user.isVerified)
        return { error: "Email not verified. Please verify first." };
    const accessToken = (0, jwt_1.generateAccessToken)({
        id: user.id,
        email: user.email,
    });
    const refreshToken = (0, jwt_1.generateRefreshToken)({
        id: user.id,
    });
    return {
        user,
        accessToken,
        refreshToken,
    };
};
exports.loginService = loginService;
const refreshTokenService = async (refreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const accessToken = (0, jwt_1.generateAccessToken)({ id: decoded.id });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({ id: decoded.id });
        return { accessToken, newRefreshToken };
    }
    catch {
        return { error: "Invalid or expired refresh token" };
    }
};
exports.refreshTokenService = refreshTokenService;
const changePasswordService = async (userId, oldPassword, newPassword) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user)
        return { error: "User not found" };
    const isCorrect = await bcrypt_1.default.compare(oldPassword, user.password);
    if (!isCorrect)
        return { error: "Old password incorrect" };
    const hashed = await (0, hash_1.hashPassword)(newPassword);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashed },
    });
    return { success: true };
};
exports.changePasswordService = changePasswordService;
