import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { redisClient } from "../../config/redis";
import { sendOTPSchema } from "../../middlewares/validate";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/sendEmail";
import { ApiResponse } from "../../utils/ApiResponse";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const sendOTP = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<Response> => {
    const { purpose } = req.params as { purpose: string };
    const { email: bodyEmail } = sendOTPSchema.parse(req.body);

    if (!["login", "register", "reset"].includes(purpose)) {
      throw new ApiError(400, "Invalid purpose");
    }

    let email = bodyEmail ?? req.user?.email;
    if (!email) throw new ApiError(400, "Email is required");

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (purpose === "login" && !user) {
      throw new ApiError(401, "Register first to login");
    }

    if (purpose === "register") {
      const users = await prisma.user.findMany({ where: { email } });

      if (users.length === 0) {
        throw new ApiError(
          400,
          "User does not exist. Register first."
        );
      }

      if (users.some((u) => u.isEmailVerified)) {
        throw new ApiError(400, "User already verified");
      }
    }

    if (purpose === "reset" && !user) {
      throw new ApiError(400, "No user found");
    }

    const OTP_EXPIRY = 300;
    const RATE_LIMIT = 10;
    const RESEND_LIMIT = 60;
    const now = Date.now();

    const otpKey = `otp:data:${purpose}:${email}`;
    const lastSentKey = `otp:lastSent:${purpose}:${email}`;
    const sentCountKey = `otp:count:${purpose}:${email}`;

    const lastSent = await redisClient.get(lastSentKey);
    if (lastSent && now - Number(lastSent) < RESEND_LIMIT * 1000) {
      throw new ApiError(429, "Wait before requesting OTP again");
    }

    const sentCount = await redisClient.get(sentCountKey);
    if (sentCount && Number(sentCount) >= RATE_LIMIT) {
      throw new ApiError(429, "OTP limit exceeded");
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await redisClient.set(otpKey, hashedOtp, { EX: OTP_EXPIRY });
    await redisClient.set(lastSentKey, now.toString(), { EX: RESEND_LIMIT });
    await redisClient.incr(sentCountKey);
    await redisClient.expire(sentCountKey, 3600);

    await sendEmail(
      email,
      `Your OTP for ${purpose}`,
      "OTP Verification",
      `Your OTP is: ${otp}`
    );

    return res
      .status(202)
      .json(new ApiResponse(202, {}, "OTP sent successfully"));
  }
);
