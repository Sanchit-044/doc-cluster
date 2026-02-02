import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { redisClient } from "../../config/redis";
import { options } from "../../constant";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyOtp } from "../verification/verifyOtp.controller";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt";

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { otp, email } = req.body as {
      otp?: string;
      email?: string;
    };

    if (!otp || !email) {
      throw new ApiError(400, "OTP and email are required");
    }

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, "Email already verified");
    }

    const isVerified = await verifyOtp(user.email, "register", otp);
    if (!isVerified) {
      throw new ApiError(400, "Invalid OTP");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await redisClient?.set(
      `user:${updatedUser.id}`,
      JSON.stringify(updatedUser),
      { EX: 3600 }
    );

    // Generate Tokens
    const accessToken = generateAccessToken({
      id: updatedUser.id,
      email: updatedUser.email,
    });

    const refreshToken = generateRefreshToken({
      id: updatedUser.id,
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { isEmailVerified: true },
          "Email verified successfully - Registration completed"
        )
      );
  }
);
