import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { hashPassword } from "../../utils/hash";
import crypto from "crypto"





export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, username, DOB, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { username }],
    },
    select: { id: true, isEmailVerified: true },
  });

  if (existing?.isEmailVerified) {
    throw new ApiError(400, "User already exists");
  }

  if (existing && !existing.isEmailVerified) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      fullName,
      DOB: DOB ? new Date(DOB) : undefined,
      password: await hashPassword(password),
         streamKey: crypto.randomBytes(16).toString("hex")
   
    },
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      "Verify your email"
    )
  );
});
