import jwt, { Secret, SignOptions } from "jsonwebtoken";

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
};

export const generateAccessToken = (
  payload: object
): string => {
  const secret: Secret = requireEnv("ACCESS_TOKEN_SECRET");

  const options: SignOptions = {
    expiresIn: requireEnv("ACCESS_TOKEN_EXPIRY") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (
  payload: object
): string => {
  const secret: Secret = requireEnv("REFRESH_TOKEN_SECRET");

  const options: SignOptions = {
    expiresIn: requireEnv("REFRESH_TOKEN_EXPIRY") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

export const generateOtpToken = (
  payload: object
): string => {
  const secret: Secret = requireEnv("OTP_SECRET");

  const options: SignOptions = {
    expiresIn: requireEnv("OTP_EXPIRY") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};
