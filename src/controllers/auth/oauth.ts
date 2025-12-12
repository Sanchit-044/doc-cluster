import { NextFunction, Request, Response } from "express";
import {  prisma } from "../../config/prisma";
import { CustomError } from "../../types";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import passport from "../../config/passport.config";

interface OauthUser {
    tempOAuthToken: string;
}

const startGoogleOauth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
};

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
        next(new CustomError("An error occurred", 500, err.message));
        return;
      }
      if (!user) {
        next(new CustomError("User not found", 404));
        return;
      }
      res.redirect(
        `${process.env.FRONTEND_URL}/google?token=${user.tempOAuthToken}`
      );
    }
  )(req, res, next);
};

const startGithubOauth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("github", {
    scope: ["user:email"],
  })(req, res, next);
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
        next(new CustomError("An error occurred", 500, err.message));
        return;
      }
      if (!user) {
        next(new CustomError("User not found", 404));
        return;
      }
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth/callback?token=${user.tempOAuthToken}`
      );
    }
  )(req, res, next);
};

const generateTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tempOAuthToken } = req.body;
    if (!tempOAuthToken) {
      next(new CustomError("Invalid token", 400));
      return;
    }

    let decoded: { email?: string } | undefined;
    try {
      decoded = jwt.verify(tempOAuthToken, process.env.TEMP_JWT_SECRET!) as {
        email?: string;
      };
    } catch (error) {
      next(new CustomError("Invalid token", 400));
      return;
    }

    const email = decoded?.email;
    if (!email) {
      next(new CustomError("Invalid token payload", 400));
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      next(new CustomError("User not found", 404));
      return;
    }

    if (user.tempOAuthToken !== tempOAuthToken) {
      next(new CustomError("Invalid token", 400));
      return;
    }

    const accessTokenKey = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenKey = process.env.REFRESH_TOKEN_SECRET;
    if (!accessTokenKey || !refreshTokenKey) {
      next(new CustomError("Something went wrong", 500));
      return;
    }

    const accessToken = jwt.sign(
      { userId: user.id, version: user.version },
      accessTokenKey,
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      { userId: user.id, version: user.version },
      refreshTokenKey,
      { expiresIn: "30d" }
    );

    const userAgent = String(req.headers["user-agent"] || "Unknown");
    const parser = new UAParser(userAgent);
    const uaDetails = parser.getResult();
    const forwardedFor = Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"];

    const ip =
      forwardedFor?.toString().split(",")[0]?.trim() || req.ip || "Unknown";

    const sessionData = {
      userId: user.id,
      token: accessToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshToken: refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: ip,
      userAgent: userAgent,
      location: ip,
      device: String(
        req.headers["x-device"] || uaDetails.device?.model || "Unknown"
      ),
      browser: String(
        req.headers["x-browser"] || uaDetails.browser?.name || "Unknown"
      ),
      os: String(req.headers["x-os"] || uaDetails.os?.name || "Unknown"),
    };

    await Promise.all([
      prisma.session.create({ data: sessionData }),
      prisma.user.update({ where: { email }, data: { tempOAuthToken: null } }),
    ]);

    res.status(200).send({
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
          refreshToken,
        },
      },
    });
  } catch (error) {
    const e = error as Error;
    next(new CustomError("Something went wrong", 500, e.message));
  }
};

export {
  startGoogleOauth,
  googleOauthCallback,
  startGithubOauth,
  githubOauthCallback,
  generateTokens,
};
