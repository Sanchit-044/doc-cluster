import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { options } from "../../constant";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyPassword } from "../../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt";
import { verifyOtp } from "../verification/verifyOtp.controller";
// import { User } from "@prisma/client";

interface LoginBody {
  emailOrPhoneOrUsername?: string;
  password?: string;
  otp?: string;
  email?: string;
}

export const loginUser = asyncHandler(
  async (
    req: Request<{}, {}, LoginBody>,
    res: Response
  ): Promise<Response> => {
    const { emailOrPhoneOrUsername, password, otp, email } = req.body;

    let user:any = null;

    
    if (otp) {
      if (!email) {
        throw new ApiError(400, "Email required");
      }

      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const verified = await verifyOtp(email, "login", otp);
      if (!verified) {
        throw new ApiError(400, "Invalid OTP");
      }
    }

    //login with password
    else {
      if (!password || !emailOrPhoneOrUsername) {
        throw new ApiError(400, "Credentials required");
      }

      const identifier = emailOrPhoneOrUsername.trim();

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier.toLowerCase() },
            { username: identifier },
            { phoneNumber: identifier },
          ],
        },
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        throw new ApiError(401, "Invalid password");
      }

      if (!user.isEmailVerified) {
        throw new ApiError(401, "Email not verified");
      }
    }

    if (!user) {
      throw new ApiError(500, "Authentication failed");
    }

    // Generate Tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, {
          id: user.id,
          email: user.email,
          username: user.username,
        })
      );
  }
);
