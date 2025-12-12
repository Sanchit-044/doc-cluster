import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CustomError } from "../../types/index";
import { UAParser } from "ua-parser-js";

type LoginBody = {
  email?: string;
  username?: string;
  password: string;
};
const COOKIE_NAME = process.env.COOKIE_NAME as string;
const REFRESH_TOKEN_EXPIRES_MS = Number(process.env.REFRESH_TOKEN_COOKIE_EXP_MS);

const loginUser = async (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => {
  try {
    let { email, username, password } = req.body ?? ({} as LoginBody);

    email = email?.trim();
    username = username?.trim();
    password = password?.trim();

    if ((!email && !username) || !password) {
      next(new CustomError("Email or username and password are required", 400));
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : undefined,
          username ? { username } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (!user || !user.isVerified) {
      next(new CustomError("User not found or not verified", 401));
      return;
    }

    if (!user.password) {
      next(new CustomError("Password not set for this account", 401));
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      next(new CustomError("Invalid password", 401));
      return;
    }

    const accessTokenKey = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenKey = process.env.REFRESH_TOKEN_SECRET;
    if (!accessTokenKey || !refreshTokenKey) {
      next(new CustomError("Server configuration error", 500));
      return;
    }

    const payload = { userId: user.id, version:  0 };
    
    const accessToken = jwt.sign(
        { userId: user.id, },
        accessTokenKey,
        { expiresIn: "1d" }
      );
      const refreshToken = jwt.sign(
        { userId: user.id ,},
        refreshTokenKey,
        { expiresIn: "7d" }
      );


    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as "lax" | "strict" | "none",
      maxAge: REFRESH_TOKEN_EXPIRES_MS,
      path: "/",
    };

    res.cookie(COOKIE_NAME, refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken,
        }
      },
    });
  } catch (error) {
    const err = error as Error;
    next(new CustomError("Something went wrong", 500, `${err.message}`));
  }
};

export default loginUser;
