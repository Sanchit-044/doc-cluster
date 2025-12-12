import { Response, Request, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "./otp";
import { CustomError, CustomOtpRequest } from "../../types";

const registerUser = async (
  req: CustomOtpRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let { email, password, username } = req.body;

    email = email?.trim().toLowerCase();
    password = password?.trim();
    username = username?.trim();

    if (!email || !password || !username) {
      return next(new CustomError("Email, password and username are required", 400));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.isVerified) {
      return next(new CustomError("Email already exists", 400));
    }

    if (existingUser && !existingUser.isVerified) {
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // FIX: Convert DOB if present
    let DOB = undefined;
    if (req.body.DOB) {
      DOB = new Date(req.body.DOB);
      if (isNaN(DOB.getTime())) {
        return next(new CustomError("Invalid DOB format", 400));
      }
    }

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        DOB, // fixed
      },
    });

    return sendOtpEmail(req, res, next);

  } catch (error) {
    console.error("REGISTER USER ERROR:", error);
    const err = error as Error;
    return next(new CustomError("Something went wrong", 500, err.message));
  }
};

export default registerUser;
