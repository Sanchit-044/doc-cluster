import { NextFunction, Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { CustomError } from "../../types";
import jwt from "jsonwebtoken";
import passport from "../../config/passport.config";

interface OauthUser {
  tempOAuthToken: string;
}

//initiate handlers
const startGoogleOauth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
};

const startGithubOauth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("github", {
    scope: ["user:email"],
  })(req, res, next);
};

//callback handlers
const googleOauthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: Error | null, user: OauthUser | false) => {
      if (err) {
        console.error("Google OAuth callback error:", err);
        return next(new CustomError("OAuth failed", 500, err.message));
      }

      if (!user) {
        return next(new CustomError("User not found", 404));
      }

      return res.redirect(
        `${process.env.FRONTEND_URL}/oauth/callback?provider=google&token=${user.tempOAuthToken}`
      );
    }
  )(req, res, next);
};

const githubOauthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "github",
    { session: false },
    (err: Error | null, user: OauthUser | false) => {
      if (err) {
        console.error("GitHub OAuth callback error:", err);
        return next(new CustomError("OAuth failed", 500, err.message));
      }

      if (!user) {
        return next(new CustomError("User not found", 404));
      }

      return res.redirect(
        `${process.env.FRONTEND_URL}/oauth/callback?provider=github&token=${user.tempOAuthToken}`
      );
    }
  )(req, res, next);
};

//token generation after oauth
const generateTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tempOAuthToken } = req.body;

    if (!tempOAuthToken) {
      return next(new CustomError("Invalid token", 400));
    }

    let decoded: { email?: string };

    try {
      decoded = jwt.verify(
        tempOAuthToken,
        process.env.TEMP_JWT_SECRET!
      ) as { email?: string };
    } catch (err) {
      return next(new CustomError("Invalid token", 400));
    }

    if (!decoded.email) {
      return next(new CustomError("Invalid token payload", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        email: true,
        username: true,
        tempOAuthToken: true,
      },
    });

    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    if (user.tempOAuthToken !== tempOAuthToken) {
      return next(new CustomError("Invalid token", 400));
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" }
    );

    await prisma.user.update({
      where: { email: user.email },
      data: { tempOAuthToken: null },
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Generate token error:", error);
    next(new CustomError("Something went wrong", 500));
  }
};

export {
  startGoogleOauth,
  googleOauthCallback,
  startGithubOauth,
  githubOauthCallback,
  generateTokens,
};
