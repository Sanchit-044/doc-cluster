import { rateLimit } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

export const ipLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    msg: "Too many requests from this IP.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    msg: "Too many requests for this email.",
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    return email
      ? email.toLowerCase().trim()
      : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const combinedLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  ipLimiter(req, res, () => {
    emailLimiter(req, res, next);
  });
};
