import { Response, NextFunction } from 'express';
import { CustomOtpRequest } from '../types/customOtpRequest';
import { CustomError } from '../types/customError';
import { prisma } from '../config/prisma';

export const loginOtp = async (req: CustomOtpRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let { email } = req.body;

        if (!email || typeof email !== "string") {
            return next(new CustomError("Email is required", 400));
        }

        email = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return next(new CustomError("User not found", 404));
        }

        if (!user.isVerified) {
            return next(new CustomError("User not verified. Please verify your email first.", 403));
        }

        req.type = "login";
        next();

    } catch (error: any) {
        console.error("LOGIN OTP ERROR:", error);
        next(new CustomError("Something went wrong while processing login OTP", 500, error.message));
    }
};


export const registerOtp = async (req: CustomOtpRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let { email } = req.body;

        if (!email || typeof email !== "string") {
            return next(new CustomError("Email is required", 400));
        }

        email = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            if (existingUser.isVerified) {
                return next(new CustomError("Email already registered and verified", 409));
            } else {
                return next(new CustomError("Email already registered but not verified", 409));
            }
        }

        req.type = "register";
        next();

    } catch (error: any) {
        console.error("REGISTER OTP ERROR:", error);
        next(new CustomError("Something went wrong while processing register OTP", 500, error.message));
    }
};
