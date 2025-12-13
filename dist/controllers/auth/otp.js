"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOtp = exports.sendOtpEmail = exports.verifyOtp = void 0;
const types_1 = require("../../types");
const sendEmail_1 = require("../../utils/sendEmail");
// import  prisma  from '../../config/passport.config';
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../config/prisma");
// import {UAParser} from "ua-parser-js";
const generateEmailContent = (otp, username, type) => {
    const isRegister = type === "register";
    const subjectText = isRegister
        ? "Welcome to Doc-Cluster! Please verify your email address by entering the One-Time Password (OTP) below:"
        : "Use the One-Time Password (OTP) below to securely log in to your Doc-Cluster account:";
    const closingText = isRegister
        ? "If you did not request this verification, you can safely ignore this email."
        : "If you did not attempt to log in, please ignore this email.";
    return `
    <body style="margin: 0; padding: 0; width: 100%; font-family: Arial, sans-serif; background-color: #ffffff;">
      <div style="max-width: 600px; width: 100%; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #EFF6FF; box-sizing: border-box;">

        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://i.ibb.co/T1BNfgR/Untitled.jpg" alt="Doc-Cluster" style="width: 140px; margin: 0 auto;">
        </div>

        <!-- Greeting -->
        <p style="color: #1E3A8A; font-size: 20px; line-height: 1.5; text-align: center;">
          Hello <strong>${username}</strong>,
        </p>

        <!-- Subject -->
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
          ${subjectText}
        </p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 30px; font-weight: bold; color: #2563EB;">${otp}</span>
        </div>

        <!-- Info Text -->
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
          This OTP is valid for the next <strong>10 minutes</strong>. Please keep it secure and do not share it with anyone.
        </p>

        <!-- Closing -->
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
          ${closingText}
        </p>

        <!-- Signature -->
        <p style="color: #1E3A8A; font-size: 16px; line-height: 1.6; text-align: center; margin-top: 20px;">
          Best regards,<br><strong>Doc-Cluster Team</strong>
        </p>

        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 30px 0;">

        <!-- Footer -->
        <p style="font-size: 13px; color: #6B7280; text-align: center; line-height: 1.5;">
          Need help? Contact our support team at 
          <a href="mailto:doccluster4u@gmail.com" style="color: #2563EB; text-decoration: none;">
            doccluster4u@gmail.com
          </a>.
        </p>

      </div>
    </body>
  `;
};
/**
 * Sends an OTP to the user's email for verification.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
const sendOtpEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            next(new types_1.CustomError('User not found', 404));
            return;
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        await Promise.allSettled([
            prisma_1.prisma.otp.deleteMany({
                where: { email }
            }),
            prisma_1.prisma.otp.create({
                data: {
                    email,
                    otp,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
                }
            })
        ]);
        const data = generateEmailContent(otp, user.username, req.type);
        if (req.type === "login") {
            res.status(200).json({ success: true, message: 'OTP sent to your email' });
        }
        (0, sendEmail_1.sendEmail)(user.email, req.type === "register" ? "Your OTP for email verification" : "Your OTP for login", data).catch((error) => { console.log("Error sending email: ", error); });
    }
    catch (error) {
        const err = error;
        next(new types_1.CustomError('Something went wrong', 500, `${err.message}`));
    }
};
exports.sendOtpEmail = sendOtpEmail;
/**
 * Verifies the OTP sent to the user's email.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
const verifyOtp = async (req, res, next) => {
    try {
        let { email, otp } = req.body;
        email = email.trim().toLowerCase();
        const type = req.type;
        if (!email || !otp || !type) {
            next(new types_1.CustomError("Email and OTP are required", 400));
            return;
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const storedOtp = await tx.otp.findFirst({
                where: {
                    email,
                    otp,
                    expiresAt: { gt: new Date() }
                }
            });
            const user = await tx.user.findUnique({
                where: { email }
            });
            if (!user) {
                next(new types_1.CustomError("User not found", 404));
                return;
            }
            if (!storedOtp) {
                next(new types_1.CustomError("Invalid Otp", 400));
                return;
            }
            if (user.isVerified && type === "register") {
                next(new types_1.CustomError("User Already Verified", 400));
                return;
            }
            if (!user.isVerified && type === "login") {
                next(new types_1.CustomError("User Not Verified", 400));
                return;
            }
            await tx.user.update({
                where: { email },
                data: { isVerified: true }
            });
            await tx.otp.delete({
                where: { id: storedOtp.id }
            });
            const accessTokenKey = process.env.ACCESS_TOKEN_SECRET;
            const refreshTokenKey = process.env.REFRESH_TOKEN_SECRET;
            if (!accessTokenKey || !refreshTokenKey) {
                console.error("Environment variables not set");
                next(new types_1.CustomError("Something went wrong", 500));
                return null;
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, accessTokenKey, { expiresIn: "7d" });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, refreshTokenKey, { expiresIn: "30d" });
            return { user, accessToken, refreshToken };
        });
        res.status(200).json({
            success: true,
            message: type === "register" ? "Email verified successfully" : "Logged in successfully",
            data: {
                user: {
                    id: result?.user.id,
                    username: result?.user.username,
                    email: result?.user.email,
                    isVerified: result?.user.isVerified,
                },
                tokens: {
                    accessToken: result?.accessToken,
                    refreshToken: result?.refreshToken
                }
            }
        });
    }
    catch (error) {
        const err = error;
        next(new types_1.CustomError('Something went wrong', 500, `${err.message}`));
    }
};
exports.verifyOtp = verifyOtp;
/**
 * Resends an OTP to the user's email if the user is not verified.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            next(new types_1.CustomError('User not found!', 404));
            return;
        }
        if (user.isVerified) {
            next(new types_1.CustomError('Email already verified!', 400));
            return;
        }
        const latestOtp = await prisma_1.prisma.otp.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });
        const thirtySeconds = 30 * 1000;
        if (latestOtp &&
            Date.now() - latestOtp.createdAt.getTime() < thirtySeconds) {
            next(new types_1.CustomError('OTP requests are limited to one per 30 seconds.', 429));
            return;
        }
        sendOtpEmail(req, res, next);
        res.status(200).json({ success: true, message: 'OTP sent to your email' });
    }
    catch (error) {
        const err = error;
        next(new types_1.CustomError('Something went wrong', 500, `${err.message}`));
    }
};
exports.resendOtp = resendOtp;
