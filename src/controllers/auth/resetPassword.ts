import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import crypto from "crypto"









export const resetPasswordLink = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) throw new ApiError(404, "User not found");

  const token = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.resetLink.deleteMany({ where: { email } });

  await prisma.resetLink.create({
    data: {
      email,
      token: hashed,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  res.json(new ApiResponse(200, {}, "Reset link sent"));
});
