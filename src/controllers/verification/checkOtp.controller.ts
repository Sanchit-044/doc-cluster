import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { options } from "../../constant";
import { checkOtpSchema } from "../../middlewares/validate";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyOtp } from "./verifyOtp.controller";

interface OtpJwtPayload {
  email: string;
  purpose: string;
}

export const checkOtp = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, otp, purpose } = checkOtpSchema.parse(req.body);
console.log("Here is coming",req.body)
    const verified = await verifyOtp(email, purpose, otp);
    if (!verified) throw new ApiError(400, "Invalid OTP");

    const otpSecret = process.env.OTP_SECRET;
    if (!otpSecret) {
      throw new ApiError(500, "OTP_SECRET missing");
    }

    const otpExpiry =
      process.env.OTP_EXPIRY && !isNaN(Number(process.env.OTP_EXPIRY))
        ? Number(process.env.OTP_EXPIRY)
        : "5m";

    const payload: OtpJwtPayload = { email, purpose };

    const otpToken = jwt.sign(payload, otpSecret, {
      expiresIn: otpExpiry,
    });

    if (purpose === "reset") {
      res.cookie("otpToken", otpToken, options);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { verified: true }, "OTP verified"));
  }
);
