import jwt, { Secret, SignOptions } from "jsonwebtoken";

export const generateAccessToken = (payload: any) => {
 if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
    throw new Error("Access token env variables not set");
  }

  const accessTokenSecret: Secret = process.env.ACCESS_TOKEN_SECRET!;
  const accessTokenExpiry: SignOptions = {
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRY),
  };

  return jwt.sign(
    payload,
    accessTokenSecret,
    accessTokenExpiry
  );
};

export const generateRefreshToken = (payload: any) => {
  if (!process.env.REFRESH_TOKEN_SECRET || !process.env.REFRESH_TOKEN_EXPIRY) {
    throw new Error("Refresh token env variables not set");
  }

  const refreshTokenSecret: Secret = process.env.REFRESH_TOKEN_SECRET!;
  const refreshTokenExpiry: SignOptions = {
    expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRY),
  };

  return jwt.sign(
    payload,
    refreshTokenSecret,
    refreshTokenExpiry
  );
};
