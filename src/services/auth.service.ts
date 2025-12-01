import { prisma } from "../utils/prisma";
import { hashPassword } from "../utils/hash";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt";

export const registerService = async (data: any) => {
  const { fullName, email, username, phoneNumber, DOB, password } = data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });

  if (exists) return { error: "User with email/username already exists" };

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      username,
      phoneNumber,
      DOB: DOB ? new Date(DOB) : undefined,
      password: hashedPassword,
      isEmailVerified: false,
      avatarUrl:
        "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg",
      avatarId: "/",
      coverInfo: {},
    },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      isEmailVerified: false,
      avatarUrl: user.avatarUrl,
      avatarId: user.avatarId,
      coverInfo: user.coverInfo,
    },
  };
};

export const loginService = async (identifier: string, password: string) => {
  let query: any = {};

  if (/^\d{10}$/.test(identifier)) query.phoneNumber = identifier;
  else if (identifier.includes("@")) query.email = identifier;
  else query.username = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: query,
  });

  if (!user) return { error: "User not found" };
  if (!user.password) return { error: "Invalid user record" };

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return { error: "Incorrect password" };

  if (!user.isEmailVerified)
    return { error: "Email not verified. Please verify first." };

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (refreshToken: string) => {


  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as any;

    const accessToken = generateAccessToken({ id: decoded.id });
    const newRefreshToken = generateRefreshToken({ id: decoded.id });

    return { accessToken, newRefreshToken };
  } catch {
    return { error: "Invalid or expired refresh token" };
  }
};

export const changePasswordService = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return { error: "User not found" };

  const isCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isCorrect) return { error: "Old password incorrect" };

  const hashed = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { success: true };
};
